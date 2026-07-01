"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@unisentinel/ui";
import { login, type ActionState } from "@/platform/auth/actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(login, {});
  return (
    <>
      <h1 className="auth__title">Sign in</h1>
      <p className="auth__sub">Welcome back to your GRC workspace.</p>
      <form action={action} className="auth__form">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {next && <input type="hidden" name="next" value={next} />}
        <label className="auth__label" htmlFor="email">
          Work email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        <label className="auth__label" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit" loading={pending} style={{ width: "100%" }}>
          Sign in
        </Button>
      </form>
    </>
  );
}
