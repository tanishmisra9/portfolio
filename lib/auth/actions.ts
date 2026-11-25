"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { loginAttempts } from "@/db/schema";
import { getSession } from "./session";

const MAX_FAILED = 8;
const WINDOW_MIN = 15;

/** Failed attempts from this IP in the window. Fails open (0) if the DB is unreachable: a throttle must never be the thing that locks the owner out. */
async function recentFailures(ip: string): Promise<number> {
  try {
    const since = new Date(Date.now() - WINDOW_MIN * 60_000);
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.at, since)));
    return row?.n ?? 0;
  } catch (e) {
    console.error("[login] throttle lookup failed:", e);
    return 0;
  }
}

/** Records the attempt BEFORE the password is compared, so parallel guesses all count (a check-then-record throttle let N parallel requests all read the old count). */
async function recordAttempt(ip: string): Promise<number | null> {
  try {
    const [row] = await db.insert(loginAttempts).values({ ip }).returning({ id: loginAttempts.id });
    await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(Date.now() - 24 * 3_600_000)));
    return row?.id ?? null;
  } catch (e) {
    console.error("[login] could not record attempt:", e);
    return null;
  }
}

/** A refused attempt never reached the password check, so it must not count: otherwise every
 *  retry while locked out slides the window forward and the lockout never ends. Every attempt
 *  that is compared keeps its row, so at most MAX_FAILED passwords are checked per window. */
async function dropAttempt(id: number) {
  try {
    await db.delete(loginAttempts).where(eq(loginAttempts.id, id));
  } catch (e) {
    console.error("[login] could not drop refused attempt:", e);
  }
}

/** A correct password clears this IP's attempts, so earlier typos don't keep counting. */
async function clearAttempts(ip: string) {
  try {
    await db.delete(loginAttempts).where(eq(loginAttempts.ip, ip));
  } catch (e) {
    console.error("[login] could not clear attempts:", e);
  }
}

export async function login(_prevState: string | undefined, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return "Enter your password.";
  }

  // Vercel always sets x-forwarded-for; the first entry is the client. Without it (local dev)
  // there is no client to throttle: one shared "unknown" bucket would let anyone lock everyone out.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || null;
  if (ip) {
    const id = await recordAttempt(ip);
    // Counts this attempt too, so the (MAX_FAILED + 1)th attempt in the window is the first one refused.
    if ((await recentFailures(ip)) > MAX_FAILED) {
      if (id !== null) await dropAttempt(id);
      return "Too many attempts. Try again in a few minutes.";
    }
  }

  const rawHash = process.env.ADMIN_PASSWORD_HASH;
  if (!rawHash) {
    // bcrypt.compare throws on an undefined hash rather than returning false, which
    // would otherwise surface as an unhandled 500 instead of a diagnosable message.
    throw new Error("ADMIN_PASSWORD_HASH is not set.");
  }
  // scripts/hash-password.mjs escapes every "$" as "\$" because Next.js expands $VAR
  // syntax when loading a .env file — but that escaping is specific to .env files, and
  // pasting the escaped value into a host that stores it verbatim (e.g. Vercel's env var
  // UI) leaves literal backslashes in the hash, which is no longer valid bcrypt and
  // throws instead of just failing to match. A real bcrypt hash never contains "\$", so
  // stripping it here is unambiguous and makes that paste-time mistake self-correcting.
  const hash = rawHash.replace(/\\\$/g, "$");

  let valid: boolean;
  try {
    valid = await bcrypt.compare(password, hash);
  } catch {
    // Any other malformed-hash case (bad copy/paste, truncation, etc.) — surface a
    // diagnosable message instead of an unhandled 500.
    throw new Error("ADMIN_PASSWORD_HASH is not a valid bcrypt hash.");
  }
  if (!valid) return "Incorrect password.";
  if (ip) await clearAttempts(ip);

  const session = await getSession();
  session.isLoggedIn = true;
  session.issuedAt = Date.now();
  await session.save();
  redirect("/admin");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}
