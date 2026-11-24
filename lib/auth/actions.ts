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

async function recordFailure(ip: string) {
  try {
    await db.insert(loginAttempts).values({ ip });
    await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(Date.now() - 24 * 3_600_000)));
  } catch (e) {
    console.error("[login] could not record failed attempt:", e);
  }
}

export async function login(_prevState: string | undefined, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return "Enter your password.";
  }

  // Vercel sets x-forwarded-for; the first entry is the client.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if ((await recentFailures(ip)) >= MAX_FAILED) {
    return "Too many attempts. Try again in a few minutes.";
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
  if (!valid) {
    await recordFailure(ip);
    return "Incorrect password.";
  }

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
