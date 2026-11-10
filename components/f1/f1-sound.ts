import {
  F1_SFX_LIGHT_GAIN,
  F1_SFX_ROAR_FADE_IN,
  F1_SFX_ROAR_FADE_OUT,
  F1_SFX_ROAR_GAIN,
  F1_SFX_ROAR_OFFSET,
  F1_SFX_ROAR_PEAK,
  F1_SFX_RUMBLE_DUCK,
  F1_SFX_RUMBLE_GAIN,
} from "@/lib/f1-motion";

/**
 * Intro sound: engine rumble from landing, a beep per start light, the roar at lights-out.
 * Web Audio rather than <audio>: iOS ignores HTMLMediaElement.volume, so the rumble couldn't be balanced or ducked.
 * Browsers block audio until the visitor interacts; if blocked, the first click/tap/key unlocks it and the sound
 * joins at the right point (rumble at its elapsed offset, or the roar part-way through). Never catches up beeps.
 */
/** lightsOut(peakInMs): the roar is scheduled so its loudest moment lands peakInMs after lights-out. */
export type F1Sound = { landing(): void; light(): void; lightsOut(peakInMs: number): void; stop(): void; dispose(): void };

const NOOP: F1Sound = { landing() {}, light() {}, lightsOut() {}, stop() {}, dispose() {} };
const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchend"] as const;

export function createF1Sound(): F1Sound {
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return NOOP;
  const ctx = new AC();
  const bufs: { rumble?: AudioBuffer; light?: AudioBuffer; roar?: AudioBuffer } = {};
  const active = new Set<{ src: AudioBufferSourceNode; g: GainNode }>();
  let landedAt = -1; // performance.now() timestamps; ctx.currentTime doesn't advance while suspended
  let outAt = -1;
  let roarAt = -1; // when the roar file (from F1_SFX_ROAR_OFFSET) should start; the rumble carries on until then
  let rumble: { src: AudioBufferSourceNode; g: GainNode } | null = null;
  let roarDone = false;
  let stopped = false;

  const running = () => ctx.state === "running" && !stopped;

  const play = (buf: AudioBuffer, gain: number, offset = 0, fadeIn = 0, delay = 0, fadeOut = 0) => {
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buf;
    src.connect(g).connect(ctx.destination);
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(fadeIn ? 0 : gain, t);
    if (fadeIn) g.gain.linearRampToValueAtTime(gain, t + fadeIn); // soften the attack / joining mid-file
    if (fadeOut) {
      // ease the tail out so the file's end (or a cut-off) never lands abruptly
      const end = t + (buf.duration - offset);
      const from = Math.max(t + fadeIn, end - fadeOut);
      g.gain.setValueAtTime(gain, from);
      g.gain.linearRampToValueAtTime(0, end);
    }
    src.start(t, offset);
    const node = { src, g };
    active.add(node);
    src.onended = () => active.delete(node);
    return node;
  };

  // the rumble fades out under the roar, starting when the roar comes in
  const duckRumble = (now: number) => {
    if (rumble && roarAt >= 0) fadeOut(rumble, F1_SFX_RUMBLE_DUCK / 1000, Math.max(0, (roarAt - now) / 1000));
  };

  const startRumble = (now: number) => {
    if (rumble || landedAt < 0 || (roarAt >= 0 && now >= roarAt) || !bufs.rumble || !running()) return;
    const off = (now - landedAt) / 1000;
    if (off >= bufs.rumble.duration - 0.3) return;
    rumble = play(bufs.rumble, F1_SFX_RUMBLE_GAIN, off, off > 0.05 ? 0.15 : 0);
    duckRumble(now);
  };

  const startRoar = (now: number) => {
    if (roarDone || roarAt < 0 || !bufs.roar || !running()) return;
    roarDone = true;
    const late = (now - roarAt) / 1000; // < 0: still ahead, schedule it
    const off = F1_SFX_ROAR_OFFSET + Math.max(0, late);
    if (off < bufs.roar.duration - 0.3) {
      play(bufs.roar, F1_SFX_ROAR_GAIN, off, late > 0.05 ? 0.1 : F1_SFX_ROAR_FADE_IN, Math.max(0, -late), F1_SFX_ROAR_FADE_OUT);
    }
  };

  const join = () => {
    const now = performance.now();
    startRumble(now);
    startRoar(now);
  };

  const unlock = () => {
    ctx.resume().then(() => {
      if (ctx.state !== "running") return;
      UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
      join();
    }, () => {});
  };
  if (ctx.state !== "running") UNLOCK_EVENTS.forEach((e) => window.addEventListener(e, unlock, true));

  const load = (url: string) =>
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx.decodeAudioData(b));
  Promise.all([load("/sfx/f1-rumble.mp3"), load("/sfx/f1-light.mp3"), load("/sfx/passby.mp3")]).then(
    ([rumbleBuf, lightBuf, roarBuf]) => {
      bufs.rumble = rumbleBuf;
      bufs.light = lightBuf;
      bufs.roar = roarBuf;
      join(); // buffers may land after the beat they belong to
    },
    () => {}, // no sound; the visuals don't depend on it
  );

  function fadeOut(node: { src: AudioBufferSourceNode; g: GainNode }, secs: number, after = 0) {
    const t = ctx.currentTime + after;
    node.g.gain.cancelScheduledValues(ctx.currentTime);
    node.g.gain.setValueAtTime(node.g.gain.value, t);
    node.g.gain.linearRampToValueAtTime(0, t + secs);
    try {
      node.src.stop(t + secs + 0.05);
    } catch {
      // already stopped
    }
  }

  const stop = () => {
    if (stopped) return;
    stopped = true;
    UNLOCK_EVENTS.forEach((e) => window.removeEventListener(e, unlock, true));
    active.forEach((n) => fadeOut(n, 0.25));
  };

  return {
    landing() {
      landedAt = performance.now();
      startRumble(landedAt);
    },
    light() {
      if (running() && bufs.light) play(bufs.light, F1_SFX_LIGHT_GAIN);
    },
    lightsOut(peakInMs: number) {
      outAt = performance.now();
      roarAt = outAt + Math.max(0, peakInMs - (F1_SFX_ROAR_PEAK - F1_SFX_ROAR_OFFSET) * 1000);
      duckRumble(outAt);
      startRoar(outAt);
    },
    stop,
    dispose() {
      stop();
      window.setTimeout(() => void ctx.close().catch(() => {}), 400);
    },
  };
}
