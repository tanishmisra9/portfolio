"use client";

import { useEffect, useRef } from "react";
import {
  RADIO_REFERENCE_SAMPLE,
  RADIO_SAMPLE_FALLBACK,
} from "@/lib/radio-samples.constants";

const TRIGGERS = ["bbb", "boxbox"] as const;
const BUFFER_MAX = 6;
const BASE_VOLUME = 0.72;
const RMS_FLOOR = 0.0008;
const GAIN_MIN = 0.45;
const GAIN_MAX = 2.2;

type Props = {
  samples: string[];
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function normalizeKey(key: string): string | null {
  if (key.length !== 1) return null;
  const lower = key.toLowerCase();
  if (lower >= "a" && lower <= "z") return lower;
  return null;
}

function matchesTrigger(buffer: string): boolean {
  return TRIGGERS.some((trigger) => buffer.endsWith(trigger));
}

function resolvePool(samples: string[]): string[] {
  return samples.length > 0 ? samples : [...RADIO_SAMPLE_FALLBACK];
}

function pickNextSample(pool: string[], lastPlayed: string | null): string {
  if (pool.length === 0) return RADIO_SAMPLE_FALLBACK[0];
  if (pool.length === 1) return pool[0];

  const candidates =
    lastPlayed !== null ? pool.filter((url) => url !== lastPlayed) : pool;
  const choices = candidates.length > 0 ? candidates : pool;
  return choices[Math.floor(Math.random() * choices.length)];
}

function clampGain(gain: number): number {
  return Math.min(GAIN_MAX, Math.max(GAIN_MIN, gain));
}

function computeRms(buffer: AudioBuffer): number {
  const { numberOfChannels, length } = buffer;
  let sumSquares = 0;
  let count = 0;

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      sumSquares += data[i] * data[i];
      count += 1;
    }
  }

  return Math.sqrt(sumSquares / count);
}

async function fetchAndDecode(
  context: AudioContext,
  url: string,
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return await context.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    return null;
  }
}

function unityGainMap(pool: string[]): Map<string, number> {
  return new Map(pool.map((url) => [url, 1]));
}

async function buildGainMap(pool: string[]): Promise<Map<string, number>> {
  const fallback = unityGainMap(pool);
  if (pool.length === 0) return fallback;

  let context: AudioContext | null = null;
  try {
    context = new AudioContext();
    if (context.state === "suspended") {
      await context.resume();
    }
  } catch {
    return fallback;
  }

  try {
    const referenceUrl = pool.includes(RADIO_REFERENCE_SAMPLE)
      ? RADIO_REFERENCE_SAMPLE
      : pool[0];

    const referenceBuffer = await fetchAndDecode(context, referenceUrl);
    if (!referenceBuffer) return fallback;

    const referenceRms = Math.max(computeRms(referenceBuffer), RMS_FLOOR);
    const gainMap = new Map<string, number>();

    await Promise.all(
      pool.map(async (url) => {
        const buffer =
          url === referenceUrl
            ? referenceBuffer
            : await fetchAndDecode(context!, url);

        if (!buffer) {
          gainMap.set(url, 1);
          return;
        }

        const sampleRms = Math.max(computeRms(buffer), RMS_FLOOR);
        gainMap.set(url, clampGain(referenceRms / sampleRms));
      }),
    );

    return gainMap.size > 0 ? gainMap : fallback;
  } catch {
    return fallback;
  } finally {
    void context.close();
  }
}

function playbackVolume(gainBySample: Map<string, number>, src: string): number {
  const gain = gainBySample.get(src) ?? 1;
  return Math.min(1, BASE_VOLUME * gain);
}

export function RadioKeystrokeListener({ samples }: Props) {
  const bufferRef = useRef("");
  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const poolRef = useRef(resolvePool(samples));
  const lastPlayedRef = useRef<string | null>(null);
  const gainBySampleRef = useRef<Map<string, number>>(unityGainMap(resolvePool(samples)));

  useEffect(() => {
    const pool = resolvePool(samples);
    poolRef.current = pool;
    gainBySampleRef.current = unityGainMap(pool);

    let cancelled = false;
    void buildGainMap(pool).then((map) => {
      if (!cancelled) gainBySampleRef.current = map;
    });

    return () => {
      cancelled = true;
    };
  }, [samples]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const letter = normalizeKey(event.key);
      if (!letter) return;

      const next = (bufferRef.current + letter).slice(-BUFFER_MAX);
      bufferRef.current = next;

      if (!matchesTrigger(next)) return;
      if (playingRef.current) return;

      const pool = poolRef.current;
      const src = pickNextSample(pool, lastPlayedRef.current);
      lastPlayedRef.current = src;
      const sfx = new Audio(src);
      audioRef.current = sfx;
      playingRef.current = true;
      sfx.volume = playbackVolume(gainBySampleRef.current, src);

      const onDone = () => {
        playingRef.current = false;
        if (audioRef.current === sfx) audioRef.current = null;
      };

      sfx.addEventListener("ended", onDone, { once: true });
      sfx.addEventListener("error", onDone, { once: true });

      void sfx.play().catch(onDone);

      bufferRef.current = "";
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      const current = audioRef.current;
      if (current) {
        current.pause();
        current.src = "";
        audioRef.current = null;
      }
      playingRef.current = false;
      bufferRef.current = "";
    };
  }, []);

  return null;
}
