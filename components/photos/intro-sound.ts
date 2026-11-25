// Scroll-driven sound for the /photos intro: a keystroke per typed letter (public/sfx/key.mp3)
// and a looped pencil scratch (public/sfx/pencil.mp3) whose loudness follows how fast the
// arrow is drawing. Browsers never treat scrolling as a gesture, so it stays silent until
// the first click/tap/key anywhere (same rule as /f1), and every call is a no-op until then.

export type IntroSound = { key(): void; scratch(speed: number): void; dispose(): void };

const NOOP: IntroSound = { key() {}, scratch() {}, dispose() {} };
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

// ── Tuning ──
const KEY_GAIN = 0.35;
const KEY_RATE = 0.82; // pitched down: the raw click is thin and bright
const KEY_RATE_JITTER = 0.08; // ± per key, so a word doesn't sound machine-gunned
const KEY_LOWPASS = 4500;
const KEY_MIN_GAP_MS = 25; // a fast flick through many letters reads as a buzz without this
const SCRATCH_MAX = 0.6;
const SCRATCH_PER_SPEED = 0.25; // gain per (stroke fraction / second)
const SCRATCH_RELEASE_MS = 90; // scroll events stop when you stop, so the scratch fades on its own
const LOOP_MARGIN = 0.05; // s trimmed off each end of the loop (mp3 encoder padding)

export function createIntroSound(): IntroSound {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return NOOP;
  const ctx = new AC();
  const bufs: { key?: AudioBuffer; pencil?: AudioBuffer } = {};
  const load = (name: "key" | "pencil") =>
    fetch(`/sfx/${name}.mp3`)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b))
      .then((b) => void (bufs[name] = b), () => {});
  void load("key");
  void load("pencil");

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
    if (!running() || !bufs.key || now - lastKey < KEY_MIN_GAP_MS) return;
    lastKey = now;
    const src = ctx.createBufferSource();
    src.buffer = bufs.key;
    src.playbackRate.value = KEY_RATE + (Math.random() * 2 - 1) * KEY_RATE_JITTER;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = KEY_LOWPASS;
    const g = ctx.createGain();
    g.gain.value = KEY_GAIN * (0.85 + Math.random() * 0.3);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start();
  };

  let pencil: { src: AudioBufferSourceNode; g: GainNode } | null = null;
  let release = 0;
  const target = (level: number, rate: number) => {
    if (!pencil) return;
    const t = ctx.currentTime;
    pencil.g.gain.setTargetAtTime(level, t, 0.03);
    pencil.src.playbackRate.setTargetAtTime(rate, t, 0.05);
  };
  const scratch = (speed: number) => {
    if (!running() || !bufs.pencil) return;
    if (!pencil) {
      const src = ctx.createBufferSource();
      src.buffer = bufs.pencil;
      src.loop = true;
      src.loopStart = LOOP_MARGIN;
      src.loopEnd = bufs.pencil.duration - LOOP_MARGIN;
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
    key,
    scratch,
    dispose() {
      window.clearTimeout(release);
      UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
      void ctx.close().catch(() => {});
    },
  };
}
