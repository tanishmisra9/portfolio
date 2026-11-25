"use client";

import { useEffect, useRef } from "react";
import { RADIO_SAMPLE_FALLBACK } from "@/lib/radio-samples.constants";

const TRIPLE_TAP_COUNT = 3;
const TRIPLE_TAP_WINDOW_MS = 800;
const BASE_VOLUME = 0.72;

type Props = {
  samples: string[];
  /** Precomputed per-clip playback gain (published snapshot); missing = 1. Visitors never download clips to measure loudness. */
  gains: Record<string, number>;
  triggers: string[];
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('a, button, [role="button"], input, textarea, select, article') !== null;
}

function normalizeKey(key: string): string | null {
  if (key.length !== 1) return null;
  const lower = key.toLowerCase();
  if (lower >= "a" && lower <= "z") return lower;
  return null;
}

function matchesTrigger(buffer: string, triggers: string[]): boolean {
  return triggers.some((trigger) => trigger.length > 0 && buffer.endsWith(trigger));
}

/** No hardcoded buffer cap — a trigger longer than a fixed limit would otherwise be
 * silently unmatchable, since the buffer only ever keeps this many trailing characters. */
function computeBufferMax(triggers: string[]): number {
  return triggers.reduce((max, t) => Math.max(max, t.length), 1);
}

function shuffleCopy(pool: string[]): string[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function playbackVolume(gains: Record<string, number>, src: string): number {
  const gain = gains[src] ?? 1;
  return Math.min(1, BASE_VOLUME * gain);
}

export function RadioKeystrokeListener({ samples, gains, triggers }: Props) {
  const bufferRef = useRef("");
  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const poolRef = useRef(samples);
  const remainingPoolRef = useRef<string[]>(shuffleCopy(samples));
  const lastPlayedRef = useRef<string | null>(null);
  const gainsRef = useRef(gains);
  const triggersRef = useRef(triggers);
  const bufferMaxRef = useRef(computeBufferMax(triggers));
  const tapCountRef = useRef(0);
  const lastTapAtRef = useRef(0);
  const tapInactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    poolRef.current = samples;
    remainingPoolRef.current = samples.length > 0 ? shuffleCopy(samples) : [];
  }, [samples]);

  useEffect(() => {
    gainsRef.current = gains;
  }, [gains]);

  useEffect(() => {
    triggersRef.current = triggers;
    bufferMaxRef.current = computeBufferMax(triggers);
    // A stale trailing buffer longer than the new max can never usefully match anyway;
    // trimming it avoids holding onto keystrokes typed under the old (possibly longer) cap.
    bufferRef.current = bufferRef.current.slice(-bufferMaxRef.current);
  }, [triggers]);

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
      sfx.volume = playbackVolume(gainsRef.current, src);

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

      const next = (bufferRef.current + letter).slice(-bufferMaxRef.current);
      bufferRef.current = next;

      if (!matchesTrigger(next, triggersRef.current)) return;

      if (playRandomRadio()) bufferRef.current = "";
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (playingRef.current) return;
      if (isInteractiveTarget(event.target)) return;

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
