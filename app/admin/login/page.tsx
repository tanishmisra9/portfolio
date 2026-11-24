"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/field";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 font-display">
      <form action={formAction} className="w-full max-w-sm space-y-4 border border-border bg-surface p-6 backdrop-blur-md md:p-8">
        <h1 className="font-display text-3xl/[1.4] font-extrabold tracking-tight text-fg">Log In</h1>
        {/* ponytail: not checked by login(); exists only so Safari's password manager sees a username + password pair */}
        <Input type="text" name="username" placeholder="Username" autoComplete="username" aria-label="Username" />
        <Input
          type="password"
          name="password"
          placeholder="Type here"
          autoComplete="current-password"
          autoFocus
          aria-invalid={!!error}
          aria-describedby={error ? "login-error" : undefined}
          className={`tracking-[0.3em] placeholder:tracking-normal ${error ? "!border-danger" : ""}`}
        />
        {error && (
          <p id="login-error" role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" pending={pending} className="w-full">
          {pending ? "Checking…" : "Log In"}
        </Button>
      </form>
    </div>
  );
}
