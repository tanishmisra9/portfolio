"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function login(_prevState: string | undefined, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return "Enter your password.";
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
