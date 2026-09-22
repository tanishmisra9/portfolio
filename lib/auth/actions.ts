"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function login(_prevState: string | undefined, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return "Enter your password.";
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    // bcrypt.compare throws on an undefined hash rather than returning false, which
    // would otherwise surface as an unhandled 500 instead of a diagnosable message.
    throw new Error("ADMIN_PASSWORD_HASH is not set.");
  }

  const valid = await bcrypt.compare(password, hash);
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
