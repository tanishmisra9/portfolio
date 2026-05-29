"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function PhotosHeader() {
  const [flashing, setFlashing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const el = new Audio("/sfx/camera.mp3");
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

    const SHUTTER_DELAY_MS = 330;
    if (audioRef.current) {
      const sfx = audioRef.current.cloneNode() as HTMLAudioElement;
      sfx.volume = 0.6;
      sfx.onended = () => {
        sfx.src = "";
      };
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
      className={`heading-bleed-mobile select-none cursor-default text-center font-display text-[clamp(2.75rem,10.5vw,6.5rem)] font-extrabold uppercase leading-none tracking-tighter sm:text-[clamp(3rem,11.5vw,7rem)] md:text-[min(8.2vw,6.75rem)] md:max-w-full motion-reduce:animate-none heading-ghost heading-ghost-photos ${
        flashing ? "camera-flash-text" : ""
      }`}
    >
      TANISHTAKESPICS
    </h1>
  );
}
