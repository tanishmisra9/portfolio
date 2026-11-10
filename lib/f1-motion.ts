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
/** Phones: footage eases from the car's width-fit scale to cover. */
export const F1_DOLLY = 900;
/** Closing tilt: playback ramps from F1_FOOTAGE_RATE to this, and the exit carries on at that speed. */
export const F1_PAN_END_RATE = 0.8;
