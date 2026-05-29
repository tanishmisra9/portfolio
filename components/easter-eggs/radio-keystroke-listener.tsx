"use client";

import { useEffect, useRef } from "react";
import { RADIO_SAMPLE_FALLBACK } from "@/lib/radio-samples.constants";

const TRIGGERS = ["bbb", "boxbox"] as const;
const BUFFER_MAX = 6;

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

export function RadioKeystrokeListener({ samples }: Props) {
  const bufferRef = useRef("");
  const playingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const poolRef = useRef(resolvePool(samples));

  useEffect(() => {
    poolRef.current = resolvePool(samples);
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
      const src = pool[Math.floor(Math.random() * pool.length)];
      const sfx = new Audio(src);
      audioRef.current = sfx;
      playingRef.current = true;
      sfx.volume = 0.72;

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
