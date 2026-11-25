// The pencil voice: a fully synthesized scratch (public/worklets/pencil.js) played from the pencil tip's motion.
// PencilStroke calls move() as the tip advances; every mapping constant lives in lib/pencil/config.ts.
//
//   where      pan follows the tip across the viewport
//   direction  brighter on upstrokes, darker and fuller on downstrokes; a downstroke presses harder
//   curvature  lighter through tight curves
//   speed      level (with a floor: any movement is audible) and paper-tooth crackle per px travelled
//   events     a tick at sharp turns, a touch where the pen lands; a release once the tip stops
//
// Browsers never treat scrolling as a gesture, so it stays silent until the first click/tap/key (as /f1), re-arming
// that unlock if iOS interrupts the context. Every call is a no-op until the context is running and the worklet loaded.

import { PENCIL } from "./config";

export type PencilMove = {
  /** Tip position in viewport px, and the viewport width. */
  x: number;
  viewport: number;
  /** Tip travel in px/s. */
  speed: number;
  /** −1 (straight up) … 1 (straight down). */
  down: number;
  /** Signed curvature, 1/px. */
  curvature: number;
};

export type PencilVoice = {
  move(m: PencilMove): void;
  tick(): void;
  touch(): void;
  dispose(): void;
};

const NOOP: PencilVoice = { move() {}, tick() {}, touch() {}, dispose() {} };
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createPencilVoice(): PencilVoice {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return NOOP;
  const ctx = new AC();
  if (!ctx.audioWorklet) {
    // AudioWorklet exists only in a secure context: a phone on the LAN dev server (http://192.168…) gets no pencil sound.
    console.warn(`[pencil] no AudioWorklet${window.isSecureContext ? "" : " (insecure context: needs https or localhost)"}; the pencil is silent.`);
    void ctx.close().catch(() => {});
    return NOOP;
  }
  const s = PENCIL.sound;
  const panner = ctx.createStereoPanner();
  panner.connect(ctx.destination);
  let node: AudioWorkletNode | null = null;
  let closed = false;
  void ctx.audioWorklet.addModule("/worklets/pencil.js").then(
    () => {
      if (closed) return;
      node = new AudioWorkletNode(ctx, "pencil", {
        numberOfInputs: 0,
        outputChannelCount: [1],
        processorOptions: { bands: s.bands, hp: s.hp, outGain: s.outGain, tooth: s.tooth, toothFreq: s.toothFreq, toothDecay: s.toothDecay },
      });
      node.connect(panner);
    },
    (e) => console.error("[pencil] could not load the synth worklet:", e),
  );

  const running = () => ctx.state === "running";
  const listen = () => UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, true));
  const unlisten = () => UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
  const unlock = () => {
    ctx.resume().then(() => {
      if (running()) unlisten();
    }, () => {});
  };
  // iOS suspends ("interrupted") the context on an app switch or a call: re-arm the unlock so the next tap revives it.
  const onState = () => {
    if (ctx.state !== "running" && ctx.state !== "closed") listen();
  };
  ctx.addEventListener("statechange", onState);
  if (!running()) listen();

  const param = (name: string) => node?.parameters.get(name);
  let release = 0;
  const live = () => running() && node !== null;

  return {
    move(m) {
      if (!live() || !(m.speed > 0)) return;
      const t = ctx.currentTime;
      const tight = 1 - 1 / (1 + s.curvatureScale * Math.abs(m.curvature)); // 0 straight … →1 tight
      const level =
        (s.floor + (s.max - s.floor) * clamp(m.speed / s.fullSpeed, 0, 1)) * (1 + s.downWeight * m.down) * (1 - s.curvatureSoft * tight);
      param("pressure")?.setTargetAtTime(level, t, s.attack);
      param("brightness")?.setTargetAtTime(-m.down * s.brightness, t, 0.03);
      param("toothRate")?.setTargetAtTime(m.speed * s.toothPerPx, t, 0.02);
      panner.pan.setTargetAtTime(clamp(s.pan * ((m.x / Math.max(1, m.viewport)) * 2 - 1), -1, 1), t, 0.05);
      window.clearTimeout(release);
      release = window.setTimeout(() => {
        const now = ctx.currentTime;
        param("pressure")?.setTargetAtTime(0, now, s.release);
        param("toothRate")?.setTargetAtTime(0, now, s.release);
      }, s.releaseAfterMs);
    },
    tick() {
      if (live()) node!.port.postMessage({ type: "burst", amp: s.tick });
    },
    touch() {
      if (live()) node!.port.postMessage({ type: "burst", amp: s.touch });
    },
    dispose() {
      closed = true;
      window.clearTimeout(release);
      ctx.removeEventListener("statechange", onState);
      unlisten();
      node?.disconnect();
      void ctx.close().catch(() => {});
    },
  };
}
