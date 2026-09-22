import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
  /** Epoch ms when the session was created. isSessionExpired() treats an older
   * session as logged out, since the cookie itself never expires (see cookieOptions). */
  issuedAt?: number;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

// The password is read lazily inside getSession(), not baked into this module-level
// object — module-level evaluation runs on every import (e.g. every request through
// middleware.ts), so validating eagerly here would turn a config error into a crash on
// paths that never actually call getSession(), like the GET /admin/login middleware skips.
const cookieOptions: Omit<SessionOptions, "password"> = {
  cookieName: "portfolio_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    // No maxAge → a true session cookie: cleared when the browser closes, instead of
    // iron-session's 14-day default that silently re-admits you on your next visit.
    // The cookie itself can still outlive a closed-then-reopened browser session on some
    // platforms, so isSessionExpired() below enforces a hard server-side TTL too.
    maxAge: undefined,
  },
};

export async function getSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one (e.g. `openssl rand -base64 32`) and add it as an environment variable.",
    );
  }
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long.");
  }
  return getIronSession<SessionData>(await cookies(), { ...cookieOptions, password: secret });
}

export function isSessionExpired(session: Partial<SessionData>): boolean {
  if (!session.isLoggedIn) return true;
  if (!session.issuedAt) return true;
  return Date.now() - session.issuedAt > SESSION_TTL_MS;
}

/** Throws if the caller isn't a logged-in admin. First line of every admin server action —
 * server actions are reachable as direct POSTs, so auth can't rely on middleware alone. */
export async function requireAdmin() {
  const session = await getSession();
  if (isSessionExpired(session)) {
    throw new Error("Not authenticated.");
  }
}
