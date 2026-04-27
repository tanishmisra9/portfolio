"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  active: boolean;
  onComplete: () => void;
  heartX: number;
  heartY: number;
};

type Spark = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  decay: number;
  color: string;
};

const REDS = [
  "#FF0000", "#E00000", "#CC0000", "#FF3333",
  "#FF1A1A", "#B30000", "#FF4444", "#D40000",
];
const rng = (min: number, max: number) => Math.random() * (max - min) + min;
const FLASH_RADIUS = 180;

export function NYCExplosion({ active, onComplete, heartX, heartY }: Props) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !active) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      onCompleteRef.current();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = 1;
    const W = window.innerWidth;
    const H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.zIndex = "9998";
    canvas.style.pointerEvents = "none";

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const isMobile = W < 768;
    const count = isMobile ? Math.floor(rng(30, 51)) : Math.floor(rng(70, 101));
    const sparks: Spark[] = Array.from({ length: count }, () => {
      const angle = rng(0, Math.PI * 2);
      const mag = rng(300, 800);
      return {
        x: heartX,
        y: heartY,
        prevX: heartX,
        prevY: heartY,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        radius: rng(3, 10),
        opacity: 1,
        decay: rng(0.2, 0.45),
        color: REDS[Math.floor(Math.random() * REDS.length)],
      };
    });

    let startTime = 0;
    let lastTimestamp = 0;
    let flashFrames = 0;

    const tick = (timestamp: number) => {
      if (startTime === 0) {
        startTime = timestamp;
        lastTimestamp = timestamp;

        ctx.clearRect(0, 0, W, H);
        const grad = ctx.createRadialGradient(
          heartX,
          heartY,
          0,
          heartX,
          heartY,
          FLASH_RADIUS,
        );
        grad.addColorStop(0, "rgba(255,255,255,0.5)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(heartX, heartY, FLASH_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        flashFrames = 1;

        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = (timestamp - startTime) / 1000;
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.033);
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, W, H);

      // Red viewport overlay — drawn first so particles render on top
      let redOpacity = 0;
      if (elapsed < 0.15) {
        redOpacity = (elapsed / 0.15) * 0.25;
      } else if (elapsed < 0.5) {
        redOpacity = 0.25;
      } else if (elapsed < 1.8) {
        redOpacity = 0.25 * (1 - (elapsed - 0.5) / 1.3);
      }
      if (redOpacity > 0) {
        ctx.fillStyle = `rgba(200,0,0,${redOpacity})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Initial radial flash — white pop for first 2-3 frames
      if (flashFrames < 3) {
        const flashOpacity = 0.5 * (1 - flashFrames / 3);
        const grad = ctx.createRadialGradient(
          heartX, heartY, 0,
          heartX, heartY, FLASH_RADIUS,
        );
        grad.addColorStop(0, `rgba(255,255,255,${flashOpacity})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(heartX, heartY, FLASH_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        flashFrames += 1;
      }

      let allDone = true;
      const sparksByColor = new Map<string, Spark[]>();

      for (const s of sparks) {
        if (s.opacity <= 0) continue;

        s.prevX = s.x;
        s.prevY = s.y;
        s.x += s.vx * dt;
        s.y += s.vy * dt; // no gravity — straight-line shockwave

        s.opacity -= s.decay * dt;
        if (s.opacity <= 0) continue;

        allDone = false;
        const group = sparksByColor.get(s.color);
        if (group) {
          group.push(s);
        } else {
          sparksByColor.set(s.color, [s]);
        }
      }

      for (const [color, group] of sparksByColor) {
        const avgOpacity =
          group.reduce((total, spark) => total + spark.opacity, 0) / group.length;

        ctx.beginPath();
        for (const spark of group) {
          ctx.moveTo(spark.x + spark.radius, spark.y);
          ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = color;
        ctx.globalAlpha = avgOpacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;

      const washDone = elapsed >= 1.8;

      if (allDone && washDone) {
        ctx.clearRect(0, 0, W, H);
        onCompleteRef.current();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  // Only re-run when active toggles — heartX/heartY/onComplete stable via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, active]);

  if (!mounted || !active) return null;

  return createPortal(<canvas ref={canvasRef} />, document.body);
}
