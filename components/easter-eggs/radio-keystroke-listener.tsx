"use client";

import { useEffect, useRef } from "react";
import {
  RADIO_REFERENCE_SAMPLE,
  RADIO_SAMPLE_FALLBACK,
} from "@/lib/radio-samples.constants";

const TRIGGERS = ["bbb", "boxbox"] as const;
const BUFFER_MAX = 6;
const TRIPLE_TAP_COUNT = 3;
const TRIPLE_TAP_WINDOW_MS = 800;
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

function shuffleCopy(pool: string[]): string[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetCycle(pool: string[]): string[] {
  if (pool.length === 0) return [];
  return shuffleCopy(pool);
}

function pickNextSampleFromCycle(
  pool: string[],
  remaining: string[],
  lastPlayed: string | null,
): { src: string; remaining: string[] } {
  if (pool.length === 0) {
    return { src: RADIO_SAMPLE_FALLBACK[0], remaining: [] };
  }
  if (pool.length === 1) {
    return { src: pool[0], remaining: [] };
  }

  let cycleRemaining = remaining;
  if (cycleRemaining.length === 0) {
    cycleRemaining = shuffleCopy(pool);
  }

  let candidates = cycleRemaining;
  if (lastPlayed !== null && cycleRemaining.length > 1) {
    const withoutLast = cycleRemaining.filter((url) => url !== lastPlayed);
    if (withoutLast.length > 0) candidates = withoutLast;
  }

  const index = Math.floor(Math.random() * candidates.length);
  const src = candidates[index];
  const nextRemaining = cycleRemaining.filter((url) => url !== src);

  return { src, remaining: nextRemaining };
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
  const remainingPoolRef = useRef<string[]>(resetCycle(resolvePool(samples)));
  const lastPlayedRef = useRef<string | null>(null);
  const gainBySampleRef = useRef<Map<string, number>>(unityGainMap(resolvePool(samples)));
  const tapCountRef = useRef(0);
  const lastTapAtRef = useRef(0);
  const tapInactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pool = resolvePool(samples);
    poolRef.current = pool;
    remainingPoolRef.current = resetCycle(pool);
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
    const playRandomRadio = (): boolean => {
      if (playingRef.current) return false;

      const pool = poolRef.current;
      const { src, remaining } = pickNextSampleFromCycle(
        pool,
        remainingPoolRef.current,
        lastPlayedRef.current,
      );
      remainingPoolRef.current = remaining;
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
      return true;
    };

    const resetTapTracking = () => {
      tapCountRef.current = 0;
      lastTapAtRef.current = 0;
      if (tapInactivityTimerRef.current !== null) {
        clearTimeout(tapInactivityTimerRef.current);
        tapInactivityTimerRef.current = null;
      }
    };

    const scheduleTapInactivityReset = () => {
      if (tapInactivityTimerRef.current !== null) {
        clearTimeout(tapInactivityTimerRef.current);
      }
      tapInactivityTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
        lastTapAtRef.current = 0;
        tapInactivityTimerRef.current = null;
      }, TRIPLE_TAP_WINDOW_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const letter = normalizeKey(event.key);
      if (!letter) return;

      const next = (bufferRef.current + letter).slice(-BUFFER_MAX);
      bufferRef.current = next;

      if (!matchesTrigger(next)) return;

      if (playRandomRadio()) bufferRef.current = "";
    };

    const handleTouchEnd = () => {
      if (playingRef.current) return;

      const now = Date.now();
      const elapsed = now - lastTapAtRef.current;

      if (tapCountRef.current > 0 && elapsed > TRIPLE_TAP_WINDOW_MS) {
        tapCountRef.current = 0;
      }

      tapCountRef.current += 1;
      lastTapAtRef.current = now;
      scheduleTapInactivityReset();

      if (tapCountRef.current >= TRIPLE_TAP_COUNT) {
        resetTapTracking();
        playRandomRadio();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchend", handleTouchEnd);
      resetTapTracking();
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
