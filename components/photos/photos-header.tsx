"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function PhotosHeader() {
  const [flashing, setFlashing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const el = new Audio("/camera.mp3");
    el.preload = "auto";
    audioRef.current = el;
    return () => {
      audioRef.current = null;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const handleClick = useCallback(() => {
    if (flashing) return;
    setFlashing(true);

    const SHUTTER_DELAY_MS = 380;
    if (audioRef.current) {
      const sfx = audioRef.current.cloneNode() as HTMLAudioElement;
      sfx.volume = 0.6;
      timersRef.current.push(
        window.setTimeout(() => {
          sfx.play().catch(() => {});
        }, SHUTTER_DELAY_MS),
      );
    }

    timersRef.current.push(
      window.setTimeout(() => setFlashing(false), 800),
    );
  }, [flashing]);

  return (
    <h1
      onClick={handleClick}
      className={`select-none cursor-default text-center font-display text-[clamp(2rem,7.2vw,6.25rem)] font-extrabold uppercase leading-none tracking-tighter sm:text-[clamp(2.25rem,8vw,7rem)] md:text-[8.8vw] motion-reduce:animate-none ${
        flashing ? "camera-flash-text" : "text-neutral-800"
      }`}
    >
      TANISHTAKESPICS
    </h1>
  );
}
