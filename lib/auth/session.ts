import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "portfolio_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    // No maxAge → a true session cookie: cleared when the browser closes, instead of
    // iron-session's 14-day default that silently re-admits you on your next visit.
    maxAge: undefined,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
