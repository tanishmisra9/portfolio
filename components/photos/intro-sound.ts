// Scroll-driven sound for the /photos intro, synthesized (no files): a keystroke click per
// typed letter, and a pencil scratch whose loudness follows how fast the arrow is drawing.
// Browsers never treat scrolling as a gesture, so it stays silent until the first
// click/tap/key anywhere (same rule as /f1), and every call is a no-op until then.

export type IntroSound = { key(): void; scratch(speed: number): void; dispose(): void };

const NOOP: IntroSound = { key() {}, scratch() {}, dispose() {} };
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

// ── Tuning ──
const KEY_GAIN = 0.5;
const KEY_MIN_GAP_MS = 25; // a fast flick through many letters reads as a buzz without this
const SCRATCH_MAX = 0.35;
const SCRATCH_PER_SPEED = 0.12; // gain per (stroke fraction / second)
const SCRATCH_RELEASE_MS = 80; // scroll events stop when you stop, so the scratch fades on its own

export function createIntroSound(): IntroSound {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return NOOP;
  const ctx = new AC();

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const running = () => ctx.state === "running";
  const unlock = () => {
    ctx.resume().then(() => {
      if (running()) UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
    }, () => {});
  };
  if (!running()) UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, true));

  let lastKey = 0;
  const key = () => {
    const now = performance.now();
    if (!running() || now - lastKey < KEY_MIN_GAP_MS) return;
    lastKey = now;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2000 + Math.random() * 1500;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(KEY_GAIN * (0.8 + Math.random() * 0.4), t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(t, Math.random() * 0.9, 0.05);
  };

  let pencil: GainNode | null = null;
  let release = 0;
  const target = (level: number) => pencil?.gain.setTargetAtTime(level, ctx.currentTime, 0.03);
  const scratch = (speed: number) => {
    if (!running()) return;
    if (!pencil) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1200;
      bp.Q.value = 0.8;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 400;
      pencil = ctx.createGain();
      pencil.gain.value = 0;
      src.connect(bp).connect(hp).connect(pencil).connect(ctx.destination);
      src.start();
    }
    target(Math.min(SCRATCH_MAX, speed * SCRATCH_PER_SPEED));
    window.clearTimeout(release);
    release = window.setTimeout(() => target(0), SCRATCH_RELEASE_MS);
  };

  return {
    key,
    scratch,
    dispose() {
      window.clearTimeout(release);
      UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
      void ctx.close().catch(() => {});
    },
  };
}
