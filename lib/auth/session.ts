import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
  /** Epoch ms when the session was created. isSessionExpired() treats an older
   * session as logged out, since the cookie itself never expires (see cookieOptions). */
  issuedAt?: number;
}

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
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
  return getIronSession<SessionData>(await cookies(), sessionOptions);
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
