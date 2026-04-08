"use client";

import { useEffect, useRef } from "react";

const CELL = 44;
const REPULSE_RADIUS = 175;
const MAX_FORCE = 14;
const DAMPING = 0.1;
const LINE_COLOR = "rgba(255, 255, 255, 0.04)";
const RESIZE_DEBOUNCE_MS = 150;

type Point = { rx: number; ry: number; x: number; y: number };

export function WarpGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const gridDimsRef = useRef({ rows: 0, cols: 0 });
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const cssSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const canvasEl: HTMLCanvasElement = cnv;

    const ctxRaw = canvasEl.getContext("2d");
    if (!ctxRaw) return;
    const c2d = ctxRaw;

    const mq = window.matchMedia("(min-width: 768px)");

    function buildGrid(cssW: number, cssH: number) {
      const cols = Math.floor(cssW / CELL) + 2;
      const rows = Math.floor(cssH / CELL) + 2;
      const points: Point[] = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const rx = c * CELL;
          const ry = r * CELL;
          points.push({ rx, ry, x: rx, y: ry });
        }
      }
      gridDimsRef.current = { rows, cols };
      pointsRef.current = points;
    }

    function resizeCanvas(el: HTMLCanvasElement) {
      const dpr = window.devicePixelRatio || 1;
      const cssW = window.innerWidth;
      const cssH = window.innerHeight;
      cssSizeRef.current = { w: cssW, h: cssH };
      el.width = Math.floor(cssW * dpr);
      el.height = Math.floor(cssH * dpr);
      el.style.width = `${cssW}px`;
      el.style.height = `${cssH}px`;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid(cssW, cssH);
    }

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    function onResize() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined;
        resizeCanvas(canvasEl);
      }, RESIZE_DEBOUNCE_MS);
    }

    function onPointerMove(e: PointerEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    const idx = (r: number, c: number, cols: number) => r * cols + c;

    function tick() {
      if (!runningRef.current) return;

      const { rows, cols } = gridDimsRef.current;
      const points = pointsRef.current;
      const mouse = mouseRef.current;
      const { w: cw, h: ch } = cssSizeRef.current;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += (p.rx - p.x) * DAMPING;
        p.y += (p.ry - p.y) * DAMPING;
        if (mouse) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < REPULSE_RADIUS && d > 1e-6) {
            const t = 1 - d / REPULSE_RADIUS;
            const f = MAX_FORCE * t * t;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
      }

      c2d.clearRect(0, 0, cw, ch);
      c2d.strokeStyle = LINE_COLOR;
      c2d.lineWidth = 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const a = points[idx(r, c, cols)];
          const b = points[idx(r, c + 1, cols)];
          c2d.beginPath();
          c2d.moveTo(a.x, a.y);
          c2d.lineTo(b.x, b.y);
          c2d.stroke();
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const a = points[idx(r, c, cols)];
          const b = points[idx(r + 1, c, cols)];
          c2d.beginPath();
          c2d.moveTo(a.x, a.y);
          c2d.lineTo(b.x, b.y);
          c2d.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function stop() {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      mouseRef.current = null;
    }

    function start() {
      if (runningRef.current) return;
      runningRef.current = true;
      resizeCanvas(canvasEl);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("resize", onResize);
      rafRef.current = requestAnimationFrame(tick);
    }

    function applyMq() {
      if (mq.matches) start();
      else stop();
    }

    const onMqChange = () => applyMq();
    mq.addEventListener("change", onMqChange);
    applyMq();

    return () => {
      mq.removeEventListener("change", onMqChange);
      stop();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 hidden md:block">
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        aria-hidden
      />
    </div>
  );
}
