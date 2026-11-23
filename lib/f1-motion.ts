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
 * Launch ink at each front tire's contact patch, drawn behind the car, random per mount. Matches the clip's own motion
 * vocabulary: solid flat masses with torn edges (smoke) and dry-brush hairline bundles (squeal), held ON 2s.
 * Tried and rejected by the user: long screen-wide rays from a vanishing point ("a mistaken video transition"); outlined
 * comic smoke circles and open ink arcs (vector line art; "completely out of place" next to the clip, and too slow).
 * Sizes in 1920x1080 scene px, speeds in scene px/s, times in ms after lights-out.
 */
/** Nothing new is born past this car-sprite index: from sprite ~20 the camera rises and the tires leave the frame. */
export const F1_SQUEAL_FADE: [number, number] = [18, 20];
/** Contact point inside the car sprite rect (fractions): the outer bottom of each front tire, just above the wing. */
export const F1_SQUEAL_CONTACT_X = 0.1;
export const F1_SQUEAL_CONTACT_Y = 0.6;
/** One drawing is held this long (the clip is on 2s at 50fps, played at 0.6x: 40ms / 0.6 = 67ms). */
export const F1_INK_HOLD = 67;
export const F1_INK_EMIT = 260; // ink is born within this long after lights-out
export const F1_INK_SIDE_POWER: [number, number] = [0.6, 1];
/** Smoke masses per side; each flies out, grows and tears apart. */
export const F1_INK_MASSES: [number, number] = [5, 9];
export const F1_INK_MASS_LIFE: [number, number] = [200, 420];
export const F1_INK_MASS_SIZE: [number, number] = [70, 150]; // half-length along the throw at birth
export const F1_INK_MASS_SPEED: [number, number] = [900, 1900];
export const F1_INK_MASS_ANGLE: [number, number] = [-0.15, 0.6]; // above horizontal
/** Dry-brush squeal bundles per tire. */
export const F1_INK_BRUSHES: [number, number] = [2, 4];
export const F1_INK_BRUSH_LIFE: [number, number] = [170, 330];
export const F1_INK_BRUSH_LEN: [number, number] = [260, 620];
export const F1_INK_BRUSH_WIDTH: [number, number] = [8, 18]; // half-width of the bundle
export const F1_INK_BRUSH_ANGLE: [number, number] = [0.02, 0.22]; // below horizontal

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
