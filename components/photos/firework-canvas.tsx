"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  active: boolean;
  onComplete: () => void;
  titleY: number;
};

type TrailPos = { x: number; y: number };

type Spark = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  radius: number;
  opacity: number;
  decay: number;
};

const rng = (min: number, max: number) => Math.random() * (max - min) + min;

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const PALETTES = [
  ["#FFD700", "#FFA500", "#FF6347"],
  ["#00FFFF", "#00BFFF", "#1E90FF"],
  ["#FF69B4", "#FF1493", "#FF00FF"],
  ["#7FFF00", "#00FF7F", "#32CD32"],
  ["#FFFFFF", "#E0E0E0", "#C0C0C0"],
];

export function FireworkCanvas({ active, onComplete, titleY }: Props) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // Capture mutable values in refs so the effect only runs once per activation
  const onCompleteRef = useRef(onComplete);
  const titleYRef = useRef(titleY);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { titleYRef.current = titleY; }, [titleY]);

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

    // Snapshot titleY once so it doesn't shift mid-animation
    const explosionTargetY = titleYRef.current + rng(-30, 30);
    const launchX = W * rng(0.2, 0.8);
    const speed = rng(400, 500);
    const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];

    let rocketX = launchX;
    let rocketY = H + 10;
    const trail: TrailPos[] = [];
    const TRAIL_LEN = 5;

    let phase: "launch" | "explode" = "launch";
    let sparks: Spark[] = [];
    let flashOpacity = 0;
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

      if (phase === "launch") {
        rocketX += Math.sin(elapsed * 8) * 0.5;
        rocketY -= speed * dt;

        trail.push({ x: rocketX, y: rocketY });
        if (trail.length > TRAIL_LEN) trail.shift();

        for (let i = 0; i < trail.length; i++) {
          const t = trail[i];
          const frac = (i + 1) / trail.length;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 5 * frac, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${frac * 0.7})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(rocketX, rocketY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,1)";
        ctx.fill();

        if (rocketY <= explosionTargetY) {
          phase = "explode";
          flashOpacity = 0.3;

          const count = Math.floor(rng(40, 61));
          sparks = Array.from({ length: count }, () => {
            const angle = rng(0, Math.PI * 2);
            const mag = rng(220, 480);
            const [r, g, b] = parseHex(
              palette[Math.floor(Math.random() * palette.length)],
            );
            return {
              x: rocketX,
              y: rocketY,
              prevX: rocketX,
              prevY: rocketY,
              vx: Math.cos(angle) * mag,
              vy: Math.sin(angle) * mag,
              r,
              g,
              b,
              radius: rng(1.5, 3),
              opacity: 1,
              decay: rng(0.7, 1.2),
            };
          });
        }
      } else {
        // Single-frame radial flash
        if (flashOpacity > 0) {
          const flash = ctx.createRadialGradient(rocketX, rocketY, 0, rocketX, rocketY, 60);
          flash.addColorStop(0, `rgba(255,255,255,${flashOpacity})`);
          flash.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(rocketX, rocketY, 60, 0, Math.PI * 2);
          ctx.fillStyle = flash;
          ctx.fill();
          flashOpacity = 0;
        }

        let allDone = true;

        for (const s of sparks) {
          if (s.opacity <= 0) continue;
          allDone = false;

          s.prevX = s.x;
          s.prevY = s.y;
          s.x += s.vx * dt;
          s.vy += 80 * dt;
          s.y += s.vy * dt;
          s.opacity -= s.decay * dt;

          const o = Math.max(s.opacity, 0);
          const rgb = `${s.r},${s.g},${s.b}`;

          // Streak trail
          ctx.beginPath();
          ctx.moveTo(s.prevX, s.prevY);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = `rgba(${rgb},${o * 0.5})`;
          ctx.lineWidth = s.radius * 0.8;
          ctx.stroke();

          // Spark head
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${rgb})`;
          ctx.globalAlpha = o;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (allDone) {
          ctx.clearRect(0, 0, W, H);
          onCompleteRef.current();
          return;
        }
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
  // Only re-run when active toggles — onComplete/titleY are stable via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, active]);

  if (!mounted || !active) return null;

  return createPortal(<canvas ref={canvasRef} />, document.body);
}
