// The pencil synth (AudioWorklet). Fully synthesized graphite-on-paper scratch, voiced by lib/pencil/voice.ts from the
// pencil tip's motion; every timbre constant comes from lib/pencil/config.ts via processorOptions.
//
//  friction bed   white noise → parallel resonant band-passes (centres/Qs/gains fitted to the reference recording),
//                 shifted up/down by `brightness` (octaves)
//  paper tooth    sparse clicks at `toothRate` per second (the voice sets it from pixels travelled, so the crackle is
//                 locked to drawn distance), each a short decaying burst through its own band
//  transients     "burst" messages: a tick at sharp turns, a touch where the pen lands
//  level          `pressure` (smoothed by the voice with setTargetAtTime)

class Pencil extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "pressure", defaultValue: 0, minValue: 0, maxValue: 4, automationRate: "k-rate" },
      { name: "brightness", defaultValue: 0, minValue: -3, maxValue: 3, automationRate: "k-rate" },
      { name: "toothRate", defaultValue: 0, minValue: 0, maxValue: 40000, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super();
    const o = options.processorOptions;
    // Each band has its own noise generator, so band powers add instead of interfering.
    // Each band is two cascaded band-passes (4th order): steeper skirts, so a strong band doesn't leak into a quiet
    // neighbour (single-stage bands left 315 Hz 4 dB hot next to the strong 500 Hz band when fitting).
    this.bands = o.bands.map((b, i) => ({ f: b.f, q: b.q, g: b.g, s1: 0, s2: 0, t: { s1: 0, s2: 0 }, seed: (0x9e3779b9 * (i + 1)) >>> 0 || 1 }));
    this.hp = o.hp ?? 0;
    this.hpA = { s1: 0, s2: 0 };
    this.hpB = { s1: 0, s2: 0 };
    this.outGain = o.outGain;
    this.toothLevel = o.tooth;
    this.toothFreq = o.toothFreq;
    this.toothDecay = Math.exp(-1 / (o.toothDecay * sampleRate));
    this.burstDecay = Math.exp(-1 / (0.008 * sampleRate));
    this.tooth = { s1: 0, s2: 0, env: 0 };
    this.burstSvf = { s1: 0, s2: 0 };
    this.burst = 0;
    this.seed = 0x2545f491;
    this.port.onmessage = (e) => {
      const m = e.data;
      if (m && m.type === "burst") this.burst = Math.max(this.burst, m.amp);
      if (m && m.type === "config") {
        // Live retuning (the fitting script): same shape as processorOptions.
        if (m.bands) this.bands = m.bands.map((b, i) => ({ ...this.bands[i], f: b.f, q: b.q, g: b.g }));
        if (typeof m.outGain === "number") this.outGain = m.outGain;
      }
    };
  }

  // xorshift32 white noise in [-1, 1); `st` holds its own seed (the processor, or one band).
  noise(st = this) {
    let x = st.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    st.seed = x >>> 0;
    return st.seed / 2147483648 - 1;
  }

  static hpf(st, c, x) {
    const v3 = x - st.s2;
    const v1 = c.a1 * st.s1 + c.a2 * v3;
    const v2 = st.s2 + c.a2 * st.s1 + c.a3 * v3;
    st.s1 = 2 * v1 - st.s1;
    st.s2 = 2 * v2 - st.s2;
    return x - c.k * v1 - v2;
  }

  // Coefficients of a TPT state-variable filter (Simper), band-pass normalised to unity peak.
  static coef(f, q) {
    const g = Math.tan((Math.PI * Math.min(f, sampleRate * 0.45)) / sampleRate);
    const k = 1 / q;
    const a1 = 1 / (1 + g * (g + k));
    return { a1, a2: g * a1, a3: g * g * a1, k };
  }

  static bp(st, c, x) {
    const v3 = x - st.s2;
    const v1 = c.a1 * st.s1 + c.a2 * v3;
    const v2 = st.s2 + c.a2 * st.s1 + c.a3 * v3;
    st.s1 = 2 * v1 - st.s1;
    st.s2 = 2 * v2 - st.s2;
    return v1 * c.k;
  }

  process(_inputs, outputs, params) {
    const out = outputs[0][0];
    if (!out) return true;
    const pressure = params.pressure[0];
    const shift = Math.pow(2, params.brightness[0]);
    const pClick = params.toothRate[0] / sampleRate;
    const coefs = this.bands.map((b) => Pencil.coef(b.f * shift, b.q));
    const hpC = this.hp > 0 ? Pencil.coef(this.hp * shift, Math.SQRT1_2) : null;
    const toothC = Pencil.coef(this.toothFreq * shift, 1.6);
    const burstC = Pencil.coef(2200 * shift, 0.9);
    const quiet = pressure < 1e-5 && this.burst < 1e-5 && this.tooth.env < 1e-5;
    for (let i = 0; i < out.length; i++) {
      if (quiet) {
        out[i] = 0;
        continue;
      }
      const w = this.noise();
      let bed = 0;
      for (let b = 0; b < this.bands.length; b++) {
        const band = this.bands[b];
        bed += band.g * Pencil.bp(band.t, coefs[b], Pencil.bp(band, coefs[b], this.noise(band)));
      }
      if (hpC) bed = Pencil.hpf(this.hpB, hpC, Pencil.hpf(this.hpA, hpC, bed));
      if (pClick > 0 && Math.random() < pClick) this.tooth.env = Math.max(this.tooth.env, 0.6 + 0.4 * Math.random());
      const click = Pencil.bp(this.tooth, toothC, w * this.tooth.env);
      this.tooth.env *= this.toothDecay;
      const burst = this.burst > 1e-5 ? Pencil.bp(this.burstSvf, burstC, this.noise() * this.burst) : 0;
      this.burst *= this.burstDecay;
      out[i] = (pressure * (bed + this.toothLevel * 3 * click) + burst) * this.outGain;
    }
    return true;
  }
}

registerProcessor("pencil", Pencil);
