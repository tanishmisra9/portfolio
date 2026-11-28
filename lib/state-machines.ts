/**
 * Allowed transitions for every UI value that moves through 3+ states. Each table is the single definition: the state
 * union is derived from its keys, writers go through `move()`, and `npm run check:states` tests the forbidden edges.
 * An empty list is a terminal state. Anything not listed is forbidden.
 */

type Edges<S extends string> = Record<S, readonly S[]>;

/** Returns `to` if from -> to is allowed, otherwise stays at `from` (and warns, so a dropped write isn't silent). */
export function move<S extends string>(edges: Edges<S>, from: S, to: S): S {
  if (edges[from].includes(to)) return to;
  console.warn(`[state-machines] blocked transition ${from} -> ${to}`);
  return from;
}

/** Super Max title flyby (components/photos/album-title.tsx; CSS keys off data-phase). */
export const ANIM_PHASE = {
  idle: ["wipe"],
  wipe: ["flyout"],
  flyout: ["flyin"],
  flyin: ["settle"],
  settle: ["idle"],
} as const satisfies Edges<string>;
export type AnimPhase = keyof typeof ANIM_PHASE;

/** NYC title (components/photos/nyc-title.tsx). `hold` is terminal: later clicks only re-trigger the explosion. */
export const NYC_PHASE = {
  idle: ["swap"],
  swap: ["hold"],
  hold: [],
} as const satisfies Edges<string>;
export type NycPhase = keyof typeof NYC_PHASE;

/** Hero name pit stop (components/hero/use-pitstop.ts). Clicks are ignored unless the phase is idle. */
export const HERO_PHASE = {
  idle: ["launch"],
  launch: ["bolt"],
  bolt: ["drive"],
  drive: ["enter"],
  enter: ["idle"],
} as const satisfies Edges<string>;
export type HeroPhase = keyof typeof HERO_PHASE;

/** Per-photo upload progress in /admin/photos. Both uploading and saving fall back to idle on error. */
export const UPLOAD_STATUS = {
  idle: ["uploading"],
  uploading: ["saving", "idle"],
  saving: ["idle"],
} as const satisfies Edges<string>;
export type UploadStatus = keyof typeof UPLOAD_STATUS;

/** Per-photo AI alt suggestion in /admin/photos. ready and failed are terminal (Reset restores aiAlt, no state change). */
export const AI_STATUS = {
  generating: ["ready", "failed"],
  ready: [],
  failed: [],
} as const satisfies Edges<string>;
export type AiStatus = keyof typeof AI_STATUS;

/** Admin save feedback (components/admin/ui/use-save-status.ts). saved fades to idle on a timer; any state can start a new save except saving itself (the hook counts overlapping saves). */
export const SAVE_STATUS = {
  idle: ["saving"],
  saving: ["saved", "error"],
  saved: ["idle", "saving"],
  error: ["idle", "saving"],
} as const satisfies Edges<string>;
export type SaveStatus = keyof typeof SAVE_STATUS;

/** The /quotes subtitle (components/quotes/quote-subtitle.tsx): the line keeps changing typeface until paused. `still` (reduced motion) is terminal. */
export const TITLE_PHASE = {
  waiting: ["cycling", "still"],
  cycling: ["paused"],
  paused: ["cycling"],
  still: [],
} as const satisfies Edges<string>;
export type TitlePhase = keyof typeof TITLE_PHASE;

/** Half-pressed shutter on the /photos title (components/photos/photos-header.tsx; CSS keys off data-half). Releasing at any point goes back to off (the click then takes the shot); a lock only comes after focusing. */
export const HALF_PRESS = {
  off: ["focusing"],
  focusing: ["locked", "off"],
  locked: ["off"],
} as const satisfies Edges<string>;
export type HalfPress = keyof typeof HALF_PRESS;
