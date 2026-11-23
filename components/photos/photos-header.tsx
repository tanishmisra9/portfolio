"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";

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
      className={`${PAGE_TITLE_CLASSES} cursor-default motion-reduce:animate-none ${
        flashing ? "camera-flash-text" : ""
      }`}
    >
      tanishtakespics
    </h1>
  );
}
