"use client";

import { PAGE_TITLE_CLASSES } from "@/components/ui/class-constants";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { createF1Sound, type F1Sound } from "@/components/f1/f1-sound";
import {
  F1_CAR_EMERGE,
  F1_CAR_RUN,
  F1_FOOTAGE_RATE,
  F1_HANDOVER,
  F1_HOLD_MAX,
  F1_HOLD_MIN,
  F1_LIGHT_START,
  F1_LIGHT_STEP,
  F1_LIGHTS_RAISE,
  F1_PAN_END_RATE,
  F1_SFX_GROWL_LEAD,
  F1_SFX_ROAR_PEAK_AT,
  F1_INK_BRUSH_ANGLE,
  F1_INK_BRUSH_LEN,
  F1_INK_BRUSH_LIFE,
  F1_INK_BRUSH_WIDTH,
  F1_INK_BRUSHES,
  F1_INK_EMIT,
  F1_INK_HOLD,
  F1_INK_MASS_ANGLE,
  F1_INK_MASS_LIFE,
  F1_INK_MASS_SIZE,
  F1_INK_MASS_SPEED,
  F1_INK_MASSES,
  F1_INK_SIDE_POWER,
  F1_SQUEAL_CONTACT_X,
  F1_SQUEAL_CONTACT_Y,
  F1_SQUEAL_FADE,
  F1_LOAD_GRACE,
  F1_ZOOM,
} from "@/lib/f1-motion";

type Frame = { x: number; y: number; w: number; h: number };
type CarManifest = { srcW: number; srcH: number; frames: Frame[] };
type FootageManifest = {
  srcW: number;
  srcH: number;
  first: number;
  last: number;
  frames: number[]; // source frame number of each kept frame
  shifts: number[]; // shifts[i]: px the image moves down from kept frame i to i + 1
  panFrom: number; // kept index where the closing camera tilt starts (every later shift is large)
  endShift: number; // px per source frame at the very end
};
type Pose = { f: number; sc: number; a: number };
type Assets = {
  car?: { m: CarManifest; imgs: HTMLImageElement[] };
  footage?: { m: FootageManifest; imgs: (HTMLImageElement | null)[] };
  failed?: boolean;
  footageFailed?: boolean;
};

const SRC_FRAME_MS = 20; // the clip is 50fps
const GHOSTS: [number, number][] = [
  [3, 0.22],
  [6, 0.15],
  [9, 0.09],
  [12, 0.05],
];
const rand = ([a, b]: [number, number]) => a + Math.random() * (b - a);
const pad = (i: number) => String(i + 1).padStart(2, "0");
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

/**
 * Closing tilt timing. Driven by displacement: starts at the clip's own speed, ramps to its end speed at
 * F1_PAN_END_RATE; `panMs` is when it begins and the same curve carries the last frame off the page.
 */
function tilt(m: FootageManifest) {
  const msPerSrc = SRC_FRAME_MS / F1_FOOTAGE_RATE;
  const panMs = (m.frames[m.panFrom] - m.first) * msPerSrc;
  const gap0 = m.frames[m.panFrom + 1] - m.frames[m.panFrom];
  const v0 = (m.shifts[m.panFrom] / gap0) * (F1_FOOTAGE_RATE / SRC_FRAME_MS); // px/ms
  const v1 = m.endShift * (F1_PAN_END_RATE / SRC_FRAME_MS);
  let panLen = 0;
  for (let i = m.panFrom; i < m.shifts.length; i++) panLen += m.shifts[i];
  const dur = (2 * panLen) / (v0 + v1);
  return { msPerSrc, panMs, v0, panLen, dur, acc: (v1 - v0) / dur };
}

async function loadImage(src: string) {
  const im = new Image();
  im.src = src;
  await im.decode();
  return im;
}

/** Replay = a fresh mount (new key): the sound object is single-use, and this also re-rolls the hold and the squeal strokes. */
export function F1Intro() {
  const [run, setRun] = useState(0);
  return (
    <F1IntroRun
      key={run}
      onReplay={() => {
        window.scrollTo(0, 0);
        setRun((n) => n + 1);
      }}
    />
  );
}

function F1IntroRun({ onReplay }: { onReplay: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"run" | "done">("run");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const lampsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const bloomRef = useRef<HTMLDivElement>(null);
  const assets = useRef<Assets>({});

  useEffect(() => {
    if (reduce) setPhase("done");
  }, [reduce]);

  // load in the background; the lights never wait for this. Car first, then the footage frames.
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    (async () => {
      try {
        const m: CarManifest = await (await fetch("/f1/car/manifest.json")).json();
        const imgs = await Promise.all(m.frames.map((_, i) => loadImage(`/f1/car/${pad(i)}.webp`)));
        if (!alive) return;
        assets.current.car = { m, imgs };

        const fm: FootageManifest = await (await fetch("/f1/footage/manifest.json")).json();
        const set = window.innerWidth < 900 ? "sm" : "lg";
        const fimgs: (HTMLImageElement | null)[] = new Array(fm.frames.length).fill(null);
        assets.current.footage = { m: fm, imgs: fimgs };
        let next = 0;
        const worker = async () => {
          while (alive && next < fimgs.length) {
            const i = next++;
            fimgs[i] = await loadImage(`/f1/footage/${set}/${pad(i)}.webp`).catch(() => null);
          }
        };
        await Promise.all([worker(), worker(), worker(), worker()]);
        if (alive && !fimgs[0]) assets.current.footageFailed = true; // no handover frame: the car runs, then it ends
      } catch {
        // car missing: nothing can run, jump to the end state. Footage missing: the car still runs, then it ends.
        if (!assets.current.car) assets.current.failed = true;
        else assets.current.footageFailed = true;
      }
    })();
    return () => {
      alive = false;
    };
  }, [reduce]);

  // no scrolling until the intro has finished
  useEffect(() => {
    if (phase === "done") return;
    const el = document.documentElement;
    const prev = el.style.overflow;
    el.style.overflow = "hidden";
    return () => {
      el.style.overflow = prev;
    };
  }, [phase]);

  const finish = useCallback(() => setPhase("done"), []);
  const sound = useRef<F1Sound | null>(null);
  // Skip button / Esc (and the asset-failure paths): cut the sound and go to the end state.
  // A natural finish uses finish(), which lets the roar's tail ring out
  const skip = useCallback(() => {
    sound.current?.stop();
    setPhase("done");
  }, []);

  useEffect(() => {
    if (reduce) return;
    const s = createF1Sound();
    sound.current = s;
    return () => {
      s.dispose();
      sound.current = null;
    };
  }, [reduce]);

  // black -> five lights -> lights out -> car resolves and rushes -> the clip's continuous take -> it carries on off the page
  useEffect(() => {
    if (phase !== "run" || reduce) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const curtain = curtainRef.current!;
    const hold = F1_HOLD_MIN + Math.random() * (F1_HOLD_MAX - F1_HOLD_MIN);
    const history: Pose[] = [];
    let cw = 0, ch = 0;
    let raf = 0;
    let start = 0;
    let T0 = -1; // lights-out, ms since landing; decided once the car is ready
    let lit = -1;
    let curtainDown = false;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = c.clientWidth;
      ch = c.clientHeight;
      c.width = Math.round(cw * dpr);
      c.height = Math.round(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);

    // scene (1920x1080, centred on the stage). The car starts at whichever is smaller, width-led (so it's whole on
    // portrait phones) or cover (desktop, landscape: already whole), then the camera pushes in over the last F1_ZOOM
    // ms of its rush, so the footage always arrives at cover (no letterbox band). Equal on desktop -> no change there.
    // u = ms since lights-out. F1_ZOOM may exceed F1_CAR_RUN; cover is still reached exactly at the handover.
    const kAt = (u: number) => {
      const cover = Math.max(cw / 1920, ch / 1080);
      const start = Math.min(cw / 1100, cover);
      const z = easeInOut(clamp01((u - (F1_CAR_RUN - F1_ZOOM)) / F1_ZOOM));
      return start + (cover - start) * z;
    };

    const drawCar = (p: Pose, alpha: number, k: number, ox = 0, oy = 0) => {
      const car = assets.current.car!;
      const f = Math.round(p.f);
      const fr = car.m.frames[f];
      const cx = cw / 2 + ox, cy = ch / 2 + oy;
      ctx.save();
      ctx.globalAlpha = alpha * p.a;
      ctx.translate(cx, cy);
      ctx.scale(k * p.sc, k * p.sc);
      ctx.drawImage(car.imgs[f], fr.x - 960, fr.y - 540, fr.w, fr.h);
      ctx.restore();
    };

    // Launch, in the clip's own motion vocabulary (see the footage: no outlined shapes anywhere, only solid flat ink
    // masses with torn edges, and dry-brush streaks that feather into hairlines). Two things per front tire, both born
    // at the contact patch and then left in screen space (the car rushes away from them), both drawn behind the car:
    //   - smoke: torn solid masses that shoot outward, grow, and tear apart;
    //   - squeal: dry-brush bundles (parallel hairlines of uneven length) that whip out along the ground and pull away.
    // Everything moves ON 2s like the clip: position and shape only change every F1_INK_HOLD ms, and each new drawing
    // re-rolls the jagged edges / hairline lengths, so it boils like hand animation instead of gliding. One flat ink
    // colour (--fg: white masses on the dark stage like the clip's white wind shapes, black on the light stage like its
    // road streaks). Every count, size, angle, delay and edge is random per mount (reload or Replay).
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#000";
    const hash = (n: number) => {
      const x = Math.sin(n * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };
    type Mass = { side: number; birth: number; life: number; ang: number; v: number; rx: number; ry: number; seed: number };
    type Brush = { side: number; birth: number; life: number; ang: number; len: number; w: number; n: number; seed: number };
    type Spot = { x: number; y: number; m: number }; // contact point (screen px) and scale when the ink was born
    const born = new Map<Mass | Brush, Spot>();
    const masses: Mass[] = [-1, 1].flatMap((side) => {
      const power = rand(F1_INK_SIDE_POWER); // uneven launches: one tire can throw more than the other
      return Array.from({ length: Math.round(rand(F1_INK_MASSES) * power) }, () => ({
        side,
        birth: F1_INK_EMIT * Math.pow(Math.random(), 1.5),
        life: rand(F1_INK_MASS_LIFE),
        ang: rand(F1_INK_MASS_ANGLE), // radians above horizontal, mirrored per side
        v: rand(F1_INK_MASS_SPEED),
        rx: rand(F1_INK_MASS_SIZE) * (0.7 + 0.3 * power),
        ry: 0,
        seed: Math.random() * 1000,
      })).map((q) => ({ ...q, ry: q.rx * rand([0.35, 0.6]) }));
    });
    const brushes: Brush[] = [-1, 1].flatMap((side) =>
      Array.from({ length: Math.round(rand(F1_INK_BRUSHES)) }, () => ({
        side,
        birth: F1_INK_EMIT * Math.random(),
        life: rand(F1_INK_BRUSH_LIFE),
        ang: rand(F1_INK_BRUSH_ANGLE), // radians below horizontal: along the ground, toward the camera
        len: rand(F1_INK_BRUSH_LEN),
        w: rand(F1_INK_BRUSH_WIDTH),
        n: 5 + Math.floor(Math.random() * 8),
        seed: Math.random() * 1000,
      })),
    );
    const contact = (fr: Frame, side: number) => ({
      x: fr.x - 960 + (side < 0 ? F1_SQUEAL_CONTACT_X : 1 - F1_SQUEAL_CONTACT_X) * fr.w,
      y: fr.y - 540 + F1_SQUEAL_CONTACT_Y * fr.h,
    });
    const drawSqueal = (p: Pose, alpha: number, k: number, u: number) => {
      const fr = assets.current.car!.m.frames[Math.round(p.f)];
      const m = k * p.sc;
      const live = p.f < F1_SQUEAL_FADE[1]; // after this the tires have left the frame: nothing new is born
      const spot = (q: Mass | Brush) => {
        let s0 = born.get(q);
        if (!s0 && live) {
          const c = contact(fr, q.side);
          s0 = { x: cw / 2 + c.x * m, y: ch / 2 + c.y * m, m };
          born.set(q, s0);
        }
        return s0;
      };
      ctx.save();
      ctx.globalAlpha = alpha; // < 1 only during the footage handover; flat ink otherwise
      ctx.fillStyle = ink;

      // dry-brush squeal: a bundle of parallel hairlines from the contact patch, each its own length (the feathered end).
      // The head shoots out over the first 35% of its life, then the tail pulls away after it.
      for (const b of brushes) {
        if (b.birth > u) continue;
        const step = Math.floor((u - b.birth) / F1_INK_HOLD);
        const t = (step * F1_INK_HOLD) / b.life;
        if (t >= 1) continue;
        const s0 = spot(b);
        if (!s0) continue;
        const dx = b.side * Math.cos(b.ang), dy = Math.sin(b.ang);
        const nx = -dy, ny = dx; // across the bundle
        const L = b.len * s0.m, W = b.w * s0.m;
        const head = Math.min(1, t / 0.35), tail = Math.max(0, (t - 0.45) / 0.55);
        ctx.beginPath();
        for (let i = 0; i < b.n; i++) {
          const off = (i / (b.n - 1) - 0.5) * W * 2.2;
          const lf = 0.45 + 0.55 * hash(b.seed + i * 7.1 + step * 31.7); // re-rolled every drawing: the bristles boil
          const th = 0.4 + 1.6 * hash(b.seed + i * 3.3); // hairline thickness, px at scale 1
          const a0 = L * tail * lf, a1 = L * head * lf;
          if (a1 - a0 < 1) continue;
          const bx = s0.x + nx * off, by = s0.y + ny * off;
          const hw = th * s0.m * (1 - t * 0.6);
          ctx.moveTo(bx + dx * a0 + nx * hw, by + dy * a0 + ny * hw);
          ctx.lineTo(bx + dx * a1, by + dy * a1); // tapers to a point at the far end
          ctx.lineTo(bx + dx * a0 - nx * hw, by + dy * a0 - ny * hw);
          ctx.closePath();
        }
        ctx.fill();
      }

      // smoke: torn solid masses. Ellipse along the throw direction, radius broken by deep jagged notches that are
      // re-drawn every hold; the notches deepen as it ages so the mass tears apart instead of fading
      for (const q of masses) {
        if (q.birth > u) continue;
        const step = Math.floor((u - q.birth) / F1_INK_HOLD);
        const age = step * F1_INK_HOLD;
        const t = age / q.life;
        if (t >= 1) continue;
        const s0 = spot(q);
        if (!s0) continue;
        const dx = q.side * Math.cos(q.ang), dy = -Math.sin(q.ang);
        const travel = q.v * (age / 1000) * (1 - 0.35 * t) * s0.m; // fast out, easing a little
        const cx = s0.x + dx * travel, cy = s0.y + dy * travel;
        const grow = 0.45 + 1.4 * Math.sqrt(t);
        const rx = q.rx * grow * s0.m, ry = q.ry * grow * (1 - 0.5 * t) * s0.m;
        const rot = Math.atan2(dy, dx);
        const cr = Math.cos(rot), sr = Math.sin(rot);
        const N = 22;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const th = (i / N) * Math.PI * 2;
          const h = hash(q.seed + i * 5.7 + step * 19.3);
          // mostly full, with deep torn notches (more and deeper as it ages); trailing edge streaks back, like the clip
          const notch = h < 0.18 + 0.45 * t ? 0.35 + 0.4 * hash(q.seed + i * 9.1 + step) : 0.85 + 0.3 * h;
          const back = Math.cos(th) < -0.3 ? 1 + 0.9 * hash(q.seed + i * 2.9 + step * 7.7) : 1; // ragged tail
          const ex = Math.cos(th) * rx * notch * back, ey = Math.sin(th) * ry * notch;
          const x = cx + ex * cr - ey * sr, y = cy + ex * sr + ey * cr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    // latest kept footage frame at or before a source frame number (held drawings were dropped in the build)
    const footageIndex = (srcN: number) => {
      const kept = assets.current.footage!.m.frames;
      let i = 0;
      while (i + 1 < kept.length && kept[i + 1] <= srcN) i++;
      return i;
    };
    const footageImage = (i: number) => {
      const imgs = assets.current.footage?.imgs;
      if (!imgs) return null;
      for (let d = 0; d < imgs.length; d++) {
        const im = imgs[i - d] ?? imgs[i + d];
        if (im) return im;
      }
      return null;
    };

    const drawFootage = (i: number, alpha: number, k: number, dy = 0) => {
      const im = footageImage(i);
      if (!im || alpha <= 0) return;
      const w = 1920 * k, h = 1080 * k;
      const x = (cw - w) / 2, y = (ch - h) / 2 + dy * k;
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, x, y, w, h);
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      if (!start) {
        start = now;
        sound.current?.landing();
      }
      const t = now - start;
      const a = assets.current;
      if (a.failed) return skip(); // nothing to show: end state, and cut the rumble

      // lights: on one by one, all out together once the hold is over and the car + handover frame are ready
      // (on a slow connection the lights just hold longer, like a real start)
      const lightsDone = F1_LIGHT_START + 4 * F1_LIGHT_STEP;
      if (T0 < 0 && t >= lightsDone + hold + F1_LOAD_GRACE) {
        // a load that hangs can't hold the lights (and the scroll lock) forever
        if (!a.car) return skip();
        if (!a.footage?.imgs[0]) a.footageFailed = true;
      }
      const ready = a.car && (a.footage?.imgs[0] || a.footageFailed);
      // the engine growl leads lights-out slightly. Readiness only ever turns on, so ready now means lights-out lands
      // exactly F1_SFX_GROWL_LEAD later; when the load-grace fallback forces lights-out it fires on the same frame
      if (T0 < 0 && ready && t >= lightsDone + hold - F1_SFX_GROWL_LEAD) sound.current?.growl();
      if (T0 < 0 && ready && t >= lightsDone + hold) {
        T0 = t;
        sound.current?.lightsOut(F1_SFX_ROAR_PEAK_AT);
      }
      const nowLit = T0 >= 0 ? 0 : Math.max(0, Math.min(5, Math.floor((t - F1_LIGHT_START) / F1_LIGHT_STEP) + 1));
      if (nowLit !== lit) {
        if (nowLit > lit && nowLit > 0) sound.current?.light();
        lit = nowLit;
        lampsRef.current.forEach((el, i) => {
          if (el) el.dataset.on = i < lit ? "1" : "0";
        });
        if (bloomRef.current) bloomRef.current.style.opacity = String((lit / 5) * 0.95);
      }

      ctx.clearRect(0, 0, cw, ch);
      if (T0 >= 0) {
        const u = t - T0;
        const last = a.car!.m.frames.length - 1;
        const fu = u - F1_CAR_RUN; // footage clock
        const k = kAt(u); // scene scale this frame (cover once the footage is up)

        // the continuous take, from clip frame 72 (= the last car sprite) onward
        const foot = a.footage;
        if (fu >= F1_HANDOVER && a.footageFailed) return finish();
        if (foot && fu >= 0) {
          const { first, frames, shifts, panFrom } = foot.m;
          const { msPerSrc, panMs, v0, panLen, acc } = tilt(foot.m); // panMs: footage clock when the closing tilt starts
          if (fu < panMs) {
            // hand-drawn section: keep its on-2s steps
            drawFootage(footageIndex(first + fu / msPerSrc), clamp01(fu / F1_HANDOVER), k);
          } else {
            // closing tilt + exit, driven by displacement so speed and acceleration never jump:
            // starts at the clip's own speed, ramps to its end speed at F1_PAN_END_RATE, then the same curve
            // simply carries the last frame off the page
            const tau = fu - panMs;
            const y = v0 * tau + 0.5 * acc * tau * tau; // px of content travel since the tilt began
            const y0 = (ch - 1080 * k) / 2;
            if (y < panLen) {
              // motion-compensated tween between kept frames A and B (B = A moved down by s)
              let i = panFrom, base = 0;
              while (i < shifts.length - 1 && base + shifts[i] <= y) base += shifts[i++];
              const da = y - base, db = shifts[i] - da, frac = da / shifts[i];
              ctx.save(); // B fills the strip at the top that A has slid away from
              ctx.beginPath();
              ctx.rect(0, 0, cw, Math.max(0, y0 + da * k));
              ctx.clip();
              drawFootage(i + 1, 1, k, -db);
              ctx.restore();
              drawFootage(i, 1, k, da);
              drawFootage(i + 1, frac, k, -db);
            } else {
              if (!curtainDown) {
                curtainDown = true; // the footage covered the stage until now, so the page can sit behind it
                curtain.style.display = "none";
              }
              const dy = y - panLen;
              drawFootage(frames.length - 1, 1, k, dy);
              if (y0 + dy * k >= ch) return finish();
            }
          }
        }

        // car: resolves out of the dark (focus pull), rushes the camera, hands over to the footage
        const carAlpha = fu < 0 ? 1 : 1 - clamp01(fu / F1_HANDOVER);
        if (carAlpha > 0) {
          const e = easeOut(clamp01(u / F1_CAR_EMERGE));
          const pose: Pose = { f: last * Math.pow(clamp01(u / F1_CAR_RUN), 1.8), sc: 0.86 + 0.14 * e, a: e };
          drawSqueal(pose, carAlpha, k, u); // behind the car and its ghosts
          for (const [lag, ga] of GHOSTS) {
            const g = history[history.length - lag];
            if (g) drawCar(g, ga * carAlpha, k);
          }
          const spread = (1 - e) * 14;
          if (spread > 0.5) {
            for (let j = 0; j < 6; j++) {
              const ang = (j / 6) * Math.PI * 2;
              drawCar(pose, 0.22 * (1 - e) * carAlpha, k, Math.cos(ang) * spread, Math.sin(ang) * spread);
            }
          }
          drawCar(pose, carAlpha, k);
          history.push(pose);
          if (history.length > 14) history.shift();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phase, reduce, finish, skip]);

  // Esc skips
  useEffect(() => {
    if (phase !== "run") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, skip]);

  return (
    <div className="relative h-[calc(100svh-5rem)] w-full overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 pt-10 md:pt-14">
        <h1 className={PAGE_TITLE_CLASSES}>
          F1
        </h1>
        <p className="mt-6 select-none text-center text-[1.375rem] leading-snug text-muted md:mt-8">
          Coming soon
        </p>
        {/* always in the page (under the stage) so the exit tilt reveals it with the heading; inert until the intro ends */}
        {!reduce && (
          <div className="mt-6 flex justify-center" inert={phase === "run"}>
            <Tooltip label="Replay">
              <button
                type="button"
                onClick={onReplay}
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Replay the intro"
                className="-m-3 flex items-center justify-center p-3 text-muted transition-colors hover:bg-fg/10 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70 active:bg-fg/20"
              >
                <RotateCcw className="size-7" strokeWidth={1.25} aria-hidden />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* stage (page background), lights and canvas, only while the intro is live */}
      {phase !== "done" && (
        <>
          <div ref={curtainRef} aria-hidden className="absolute inset-0 bg-bg" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ transform: `translateY(-${F1_LIGHTS_RAISE}%)` }}
          >
            <div className="relative flex gap-[2.4vmin]">
              <div ref={bloomRef} className="f1-bloom" />
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    lampsRef.current[i] = el;
                  }}
                  className="f1-lamp"
                />
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
          <button
            type="button"
            onClick={skip}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-[0.25em] text-dim transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
          >
            Skip
          </button>
        </>
      )}
    </div>
  );
}
