// Scroll-driven sound for the /photos intro: a looped pencil scratch (public/sfx/pencil.mp3)
// whose loudness follows how fast the arrow is drawing. Browsers never treat scrolling as a gesture, so it stays silent until
// the first click/tap/key anywhere (same rule as /f1), and every call is a no-op until then.

export type IntroSound = { scratch(speed: number): void; dispose(): void };

const NOOP: IntroSound = { scratch() {}, dispose() {} };
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

// ── Tuning ──
const SCRATCH_MAX = 0.6;
const SCRATCH_PER_SPEED = 0.25; // gain per (stroke fraction / second)
const SCRATCH_RELEASE_MS = 90; // scroll events stop when you stop, so the scratch fades on its own
const LOOP_MARGIN = 0.05; // s trimmed off each end of the loop (mp3 encoder padding)

export function createIntroSound(): IntroSound {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return NOOP;
  const ctx = new AC();
  let buf: AudioBuffer | null = null;
  void fetch("/sfx/pencil.mp3")
    .then((r) => r.arrayBuffer())
    .then((b) => ctx.decodeAudioData(b))
    .then((b) => void (buf = b), () => {});

  const running = () => ctx.state === "running";
  const listen = () => UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, true));
  const unlisten = () => UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
  const unlock = () => {
    ctx.resume().then(() => {
      if (running()) unlisten();
    }, () => {});
  };
  // iOS suspends ("interrupted") the context on an app switch or a call, after the first
  // unlock already removed its listeners: re-arm them so the next tap revives the sound.
  const onState = () => {
    if (ctx.state !== "running" && ctx.state !== "closed") listen();
  };
  ctx.addEventListener("statechange", onState);
  if (!running()) listen();

  let pencil: { src: AudioBufferSourceNode; g: GainNode } | null = null;
  let release = 0;
  const target = (level: number, rate: number) => {
    if (!pencil) return;
    const t = ctx.currentTime;
    pencil.g.gain.setTargetAtTime(level, t, 0.03);
    pencil.src.playbackRate.setTargetAtTime(rate, t, 0.05);
  };
  const scratch = (speed: number) => {
    if (!running() || !buf) return;
    if (!pencil) {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = LOOP_MARGIN;
      src.loopEnd = buf.duration - LOOP_MARGIN;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g).connect(ctx.destination);
      src.start(0, LOOP_MARGIN);
      pencil = { src, g };
    }
    const level = Math.min(SCRATCH_MAX, speed * SCRATCH_PER_SPEED);
    target(level, 0.9 + Math.min(0.2, speed * 0.05)); // a faster stroke scratches a little higher
    window.clearTimeout(release);
    release = window.setTimeout(() => target(0, 0.9), SCRATCH_RELEASE_MS);
  };

  return {
    scratch,
    dispose() {
      window.clearTimeout(release);
      ctx.removeEventListener("statechange", onState);
      unlisten();
      void ctx.close().catch(() => {});
    },
  };
}
