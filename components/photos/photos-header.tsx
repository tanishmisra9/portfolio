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
    <div className="flex flex-col items-center">
      <h1 className={`${PAGE_TITLE_CLASSES} motion-reduce:animate-none ${flashing ? "camera-flash-text" : ""}`}>
        <button
          type="button"
          onClick={handleClick}
          aria-label="tanishtakespics. Take a photo"
          data-shot={flashing ? "on" : "off"}
          className="viewfinder viewfinder-title relative cursor-pointer px-[0.35em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 focus-visible:ring-offset-8 focus-visible:ring-offset-bg"
        >
          tanishtakespics
        </button>
      </h1>
    </div>
  );
}
