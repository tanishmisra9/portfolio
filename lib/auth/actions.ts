"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function login(_prevState: string | undefined, formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || !password) {
    return "Enter your password.";
  }

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH!);
  if (!valid) {
    return "Incorrect password.";
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();
  redirect("/admin");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/admin/login");
}
