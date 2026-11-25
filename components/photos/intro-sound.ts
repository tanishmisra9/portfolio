// Scroll-driven sound for the /photos intro: a looped pencil scratch (public/sfx/pencil.mp3)
// whose loudness follows how fast the arrow is drawing. Browsers never treat scrolling as a gesture, so it stays silent until
// the first click/tap/key anywhere (same rule as /f1), and every call is a no-op until then.

export type IntroSound = { scratch(speed: number): void; dispose(): void };

const NOOP: IntroSound = { scratch() {}, dispose() {} };
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

// ── Tuning ──
// Any pen movement is clearly audible (the floor); speed only adds loudness on top. Gain that
// was purely proportional to speed left slow scrolls silent and a single nudge inaudible.
// Halved (−6 dB) after the sample was normalised to −1 dB: the owner found the full range "a bit too loud".
const SCRATCH_FLOOR = 0.11;
const SCRATCH_MAX = 0.3;
const SCRATCH_FULL_SPEED = 2; // stroke fraction / second at which it reaches SCRATCH_MAX
const SCRATCH_ATTACK = 0.012; // s time constant: the pen bites almost at once
const SCRATCH_DECAY = 0.06; // s time constant of the fade once you stop
const SCRATCH_RELEASE_MS = 150; // scroll events stop when you stop; this bridges mouse-wheel notches (~120ms apart)
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
  const target = (level: number, rate: number, tau: number) => {
    if (!pencil) return;
    const t = ctx.currentTime;
    pencil.g.gain.setTargetAtTime(level, t, tau);
    pencil.src.playbackRate.setTargetAtTime(rate, t, 0.05);
  };
  const scratch = (speed: number) => {
    if (!running() || !buf || !(speed > 0)) return;
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
    const level = SCRATCH_FLOOR + (SCRATCH_MAX - SCRATCH_FLOOR) * Math.min(1, speed / SCRATCH_FULL_SPEED);
    target(level, 0.9 + Math.min(0.2, speed * 0.05), SCRATCH_ATTACK); // a faster stroke scratches a little higher
    window.clearTimeout(release);
    release = window.setTimeout(() => target(0, 0.9, SCRATCH_DECAY), SCRATCH_RELEASE_MS);
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
