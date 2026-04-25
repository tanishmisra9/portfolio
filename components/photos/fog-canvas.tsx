"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  active: boolean;
  onComplete: () => void;
};

type FogPuff = {
  x: number;
  baseY: number;
  baseRadius: number;
  radiusDrift: number;
  radiusPhase: number;
  radiusFreq: number;
  opacity: number;
  speed: number;
  yDrift: number;
  yFreq: number;
  phase: number;
};

const rng = (min: number, max: number) => Math.random() * (max - min) + min;

export function FogCanvas({ active, onComplete }: Props) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !active) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      onComplete();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
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

    // Fill the full screen with puffs distributed across the entire height.
    // Use many large puffs so the fog feels volumetric, not like a thin strip.
    const count = Math.floor(rng(18, 26));

    const puffs: FogPuff[] = Array.from({ length: count }, () => {
      const baseRadius = rng(180, 360);
      return {
        x: rng(-500, 0),
        baseY: rng(-80, H + 80),
        baseRadius,
        radiusDrift: baseRadius * rng(0.15, 0.32),
        radiusPhase: rng(0, Math.PI * 2),
        radiusFreq: rng(0.2, 0.5),
        opacity: rng(0.04, 0.09),
        speed: rng(180, 320),
        yDrift: rng(40, 90),
        yFreq: rng(0.25, 0.6),
        phase: rng(0, Math.PI * 2),
      };
    });

    let startTime = 0;
    let lastTimestamp = 0;

    const tick = (timestamp: number) => {
      if (startTime === 0) {
        startTime = timestamp;
        lastTimestamp = timestamp;
      }
      const elapsed = (timestamp - startTime) / 1000;
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      const FADE_IN = 0.7;
      const fadeIn = Math.min(elapsed / FADE_IN, 1);

      let allDone = true;

      for (const p of puffs) {
        p.x += p.speed * dt;
        const y = p.baseY + Math.sin(elapsed * p.yFreq + p.phase) * p.yDrift;
        const r = p.baseRadius + Math.sin(elapsed * p.radiusFreq + p.radiusPhase) * p.radiusDrift;

        if (p.x - r <= W) allDone = false;

        const o = p.opacity * fadeIn;
        const grad = ctx.createRadialGradient(p.x, y, 0, p.x, y, r);
        grad.addColorStop(0, `rgba(255,255,255,${o})`);
        grad.addColorStop(0.4, `rgba(255,255,255,${o * 0.6})`);
        grad.addColorStop(1, `rgba(255,255,255,0)`);

        ctx.beginPath();
        ctx.arc(p.x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      if (allDone) {
        ctx.clearRect(0, 0, W, H);
        onComplete();
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
  }, [mounted, active, onComplete]);

  if (!mounted || !active) return null;

  return createPortal(<canvas ref={canvasRef} />, document.body);
}
