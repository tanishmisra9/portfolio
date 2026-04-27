"use client";

import { useEffect } from "react";

let warmNycAssetsPromise: Promise<void> | null = null;

function decodeImage(src: string): Promise<void> {
  const img = new window.Image();
  img.src = src;
  img.decoding = "async";

  if (typeof img.decode === "function") {
    return img.decode().catch(() => {});
  }

  return new Promise((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });
}

export function warmNycAssets(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!warmNycAssetsPromise) {
    warmNycAssetsPromise = (async () => {
      const tasks: Promise<unknown>[] = [decodeImage("/heart.png")];

      if (
        "fonts" in document &&
        typeof document.fonts?.load === "function"
      ) {
        tasks.push(
          document.fonts
            .load('500 1em "ITC American Typewriter"', "I LOVE NEW YORK")
            .then(() => undefined)
            .catch(() => {}),
        );
      }

      await Promise.all(tasks);
    })();
  }

  return warmNycAssetsPromise;
}

export function NYCAssetsWarmup() {
  useEffect(() => {
    void warmNycAssets();
  }, []);

  return null;
}
