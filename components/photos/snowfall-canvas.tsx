"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type SnowfallCanvasHandle = { triggerBurst: () => void };

type Flake = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  opacity: number;
  dead: boolean;
};

type Burst = {
  spawnTimes: number[];
  spawned: number;
  startTime: number;
};

type SceneState = {
  flakes: Flake[];
  bursts: Burst[];
  lastBurstTime: number;
  startTime: number;
  lastTimestamp: number;
  W: number;
  H: number;
  isMobile: boolean;
  reducedMotion: boolean;
};

const rng = (min: number, max: number) => Math.random() * (max - min) + min;

export const SnowfallCanvas = forwardRef<SnowfallCanvasHandle>(
  function SnowfallCanvas(_props, ref) {
    const [mounted, setMounted] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const stateRef = useRef<SceneState | null>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    useImperativeHandle(ref, () => ({
      triggerBurst: () => {
        const state = stateRef.current;
        if (!state || state.reducedMotion) return;
        const now = performance.now();
        if (now - state.lastBurstTime < 2000) return;
        state.lastBurstTime = now;
        const total = state.isMobile ? 200 : 400;
        const spawnTimes = Array.from({ length: total }, () =>
          rng(0, 2000),
        ).sort((a, b) => a - b);
        state.bursts.push({ spawnTimes, spawned: 0, startTime: 0 });
      },
    }));

    useEffect(() => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const isMobile = window.innerWidth < 768;
      const dpr = window.devicePixelRatio || 1;
      const W = window.innerWidth;
      const H = window.innerHeight;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      canvas.style.position = "fixed";
      canvas.style.inset = "0";
      canvas.style.zIndex = "9999";
      canvas.style.pointerEvents = "none";

      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      const state: SceneState = {
        flakes: [],
        bursts: [],
        lastBurstTime: 0,
        startTime: 0,
        lastTimestamp: 0,
        W,
        H,
        isMobile,
        reducedMotion,
      };
      stateRef.current = state;

      if (reducedMotion) return;

      const tick = (timestamp: number) => {
        if (state.startTime === 0) {
          state.startTime = timestamp;
          state.lastTimestamp = timestamp;
        }
        const elapsed = timestamp - state.startTime;
        const dt = Math.min((timestamp - state.lastTimestamp) / 1000, 0.05);
        state.lastTimestamp = timestamp;

        // --- Spawn ---
        for (const burst of state.bursts) {
          if (burst.startTime === 0) burst.startTime = timestamp;
          const burstElapsed = timestamp - burst.startTime;
          while (
            burst.spawned < burst.spawnTimes.length &&
            burst.spawnTimes[burst.spawned] <= burstElapsed
          ) {
            state.flakes.push({
              x: rng(0, W),
              y: -10,
              r: rng(2, 4),
              vy: rng(200, 400),
              vx: rng(-15, 15),
              opacity: rng(0.5, 1.0),
              dead: false,
            });
            burst.spawned++;
          }
        }

        // --- Physics ---
        for (const f of state.flakes) {
          if (f.dead) continue;
          f.y += f.vy * dt;
          f.x += f.vx * dt;
          f.x += Math.sin(elapsed * 0.002 + f.x * 0.01) * 0.3;
          if (f.y > H + 10) f.dead = true;
        }

        // --- Prune ---
        state.bursts = state.bursts.filter(
          (b) => b.spawned < b.spawnTimes.length,
        );
        state.flakes = state.flakes.filter((f) => !f.dead);

        // --- Draw ---
        ctx.clearRect(0, 0, W, H);
        for (const f of state.flakes) {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
          ctx.fill();
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        stateRef.current = null;
      };
    }, [mounted]);

    if (!mounted) return null;

    return createPortal(<canvas ref={canvasRef} />, document.body);
  },
);
