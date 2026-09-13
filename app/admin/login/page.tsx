"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-lg border border-fg/10 p-6"
      >
        <h1 className="font-display text-lg text-fg">Admin login</h1>
        <input
          type="password"
          name="password"
          placeholder="Password"
          autoFocus
          className="w-full rounded border border-fg/20 bg-transparent px-3 py-2 text-fg outline-none focus-visible:ring-2 focus-visible:ring-fg/70"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-fg px-3 py-2 text-bg disabled:opacity-50"
        >
          {pending ? "Checking..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
