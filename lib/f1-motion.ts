/** /f1 intro timeline, all in ms. Lights are measured from landing; the rest from lights-out (T0). */
export const F1_LIGHT_START = 500;
export const F1_LIGHT_STEP = 500;
/** Random hold after the fifth light, like a real start. */
export const F1_HOLD_MIN = 600;
export const F1_HOLD_MAX = 2200;
/** Gantry sits this % of the stage height above centre. */
export const F1_LIGHTS_RAISE = 23;
/** If assets still haven't loaded this long after the lights would normally go out, stop waiting (never hang). */
export const F1_LOAD_GRACE = 5000;

/** Car cut-out (clip 49..72): resolves out of the dark, then rushes the camera. */
export const F1_CAR_EMERGE = 700;
export const F1_CAR_RUN = 1500;

/**
 * Tire-squeal ink strokes behind the car (random per run, drawn before the car). Sizes are in 1920x1080 scene px.
 * They fade out between these car-sprite indices: from sprite ~20 the camera rises over the car and the tires leave
 * the frame, so a fixed tire anchor stops being true.
 */
export const F1_SQUEAL_PER_TIRE: [number, number] = [26, 38];
export const F1_SQUEAL_LEN: [number, number] = [160, 1400]; // full length
export const F1_SQUEAL_WIDTH: [number, number] = [0.8, 4.5]; // half-width at the widest point
export const F1_SQUEAL_ALPHA: [number, number] = [0.35, 1]; // per-stroke opacity
export const F1_SQUEAL_SPEED: [number, number] = [0.55, 1.4]; // per-stroke growth rate, so they don't extend in lockstep
export const F1_SQUEAL_SPREAD = 0.3; // anchor height scatter, fraction of the car rect
export const F1_SQUEAL_SPREAD_X = 0.05; // anchor sideways scatter
/** Strokes run along rays from a vanishing point at this height of the car rect (0 = top); below the tires, so they fan up and out. */
export const F1_SQUEAL_VP_Y = 0.8;
export const F1_SQUEAL_AIM_SCATTER = 0.12; // radians off the ray
export const F1_SQUEAL_BEND = 0.04; // sideways bow, fraction of length
export const F1_SQUEAL_FADE: [number, number] = [19, 22];
/** Tire anchor inside the car sprite rect (fractions); the root sits under the tire so it's hidden by it. */
export const F1_SQUEAL_ANCHOR_X = 0.22;
export const F1_SQUEAL_ANCHOR_Y = 0.45;

/** Clip 72..152 as one continuous take. Source is 50fps; RATE < 1 slows it for weight. */
export const F1_HANDOVER = 160;
export const F1_FOOTAGE_RATE = 0.6;
/** Phones: over the last F1_ZOOM ms of the car's rush the scene eases from width-fit to cover (camera pushes in). */
export const F1_ZOOM = 700;
/** Closing tilt: playback ramps from F1_FOOTAGE_RATE to this, and the exit carries on at that speed. */
export const F1_PAN_END_RATE = 0.8;

/** Sound: gains balanced from measured mean levels (rumble -13.5dB, light -16dB, roar -14dB). */
export const F1_SFX_RUMBLE_GAIN = 1.0;
export const F1_SFX_LIGHT_GAIN = 0.25;
export const F1_SFX_ROAR_GAIN = 0.56;
/** Seconds: soften the roar's attack and ease out its tail (it sounded harsh at both ends). */
export const F1_SFX_ROAR_FADE_IN = 0.45;
export const F1_SFX_ROAR_FADE_OUT = 1.4;
/** The roar file is near-silent for its first 0.2s, so it is started from there. */
export const F1_SFX_ROAR_OFFSET = 0.2;
/**
 * ms after lights-out when the roar should be loudest: just after the helmet has fully arrived. The clip's first pan
 * (camera coming down off the car onto the helmet) settles ~400ms into the footage, which starts F1_CAR_RUN after
 * lights-out; +400 and +700 felt early, so it lands ~500ms after that. The growl/rumble fades follow the roar's entry.
 * Ceiling: the growl file (2.85s, from LEAD before lights-out) must outlast roar entry + F1_SFX_GROWL_FADE_OUT.
 */
export const F1_SFX_ROAR_PEAK_AT = F1_CAR_RUN + 900;
/** Seconds into the roar file (public/sfx/passby.mp3) where it is loudest. */
export const F1_SFX_ROAR_PEAK = 1.25;
/** Engine growl/rev (public/sfx/f1-growl.mp3, mono): starts LEAD ms before lights-out so its rev surges on it,
 * then fades out under the roar once the roar comes in. Seconds for the fades. */
export const F1_SFX_GROWL_GAIN = 0.95;
export const F1_SFX_GROWL_LEAD = 150;
export const F1_SFX_GROWL_FADE_IN = 0.08;
export const F1_SFX_GROWL_FADE_OUT = 1.2;
export const F1_SFX_RUMBLE_DUCK = 1600; // ms the rumble takes to fade out under the roar once the roar comes in
