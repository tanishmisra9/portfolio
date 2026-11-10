/** /f1 intro timeline, all in ms. Lights are measured from landing; the rest from lights-out (T0). */
export const F1_LIGHT_START = 500;
export const F1_LIGHT_STEP = 500;
/** Random hold after the fifth light, like a real start. */
export const F1_HOLD_MIN = 600;
export const F1_HOLD_MAX = 2200;
/** Gantry sits this % of the stage height above centre. */
export const F1_LIGHTS_RAISE = 23;

/** Car cut-out (clip 49..72): resolves out of the dark, then rushes the camera. */
export const F1_CAR_EMERGE = 700;
export const F1_CAR_RUN = 1500;

/** Clip 72..152 as one continuous take. Source is 50fps; RATE < 1 slows it for weight. */
export const F1_HANDOVER = 160;
export const F1_FOOTAGE_RATE = 0.6;
/** Phones: over the last F1_ZOOM ms of the car's rush the scene eases from width-fit to cover (camera pushes in). */
export const F1_ZOOM = 700;
/** Closing tilt: playback ramps from F1_FOOTAGE_RATE to this, and the exit carries on at that speed. */
export const F1_PAN_END_RATE = 0.8;

/** Sound: gains balanced from measured mean levels (rumble -13.5dB, light -16dB, roar -14dB). */
export const F1_SFX_RUMBLE_GAIN = 0.8;
export const F1_SFX_LIGHT_GAIN = 0.5;
export const F1_SFX_ROAR_GAIN = 0.56;
/** Seconds: soften the roar's attack and ease out its tail (it sounded harsh at both ends). */
export const F1_SFX_ROAR_FADE_IN = 0.45;
export const F1_SFX_ROAR_FADE_OUT = 1.4;
/** The roar file is near-silent for its first 0.2s, so it is started from there. */
export const F1_SFX_ROAR_OFFSET = 0.2;
/**
 * ms after lights-out when the roar should be loudest: the helmet has fully arrived. The clip's first pan (camera
 * coming down off the car onto the helmet) settles ~400ms into the footage, which starts F1_CAR_RUN after lights-out.
 */
export const F1_SFX_ROAR_PEAK_AT = F1_CAR_RUN + 400;
/** Seconds into the roar file where it is loudest. */
export const F1_SFX_ROAR_PEAK = 1.25;
export const F1_SFX_RUMBLE_DUCK = 1600; // ms the rumble takes to fade out under the roar once the roar comes in
