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
