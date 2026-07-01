"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@unisentinel/ui";
import { changePassword, type ActionState } from "@/platform/auth/actions";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(changePassword, {});
  return (
    <>
      <h1 className="auth__title">Change your password</h1>
      <p className="auth__sub">
        {forced
          ? "You signed in with a temporary password — set your own to continue."
          : "Choose a new password (at least 12 characters, with a letter and a digit)."}
      </p>
      <form action={action} className="auth__form">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <label className="auth__label" htmlFor="current">
          Current password
        </label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
        <label className="auth__label" htmlFor="password">
          New password
        </label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
        <label className="auth__label" htmlFor="confirm">
          Confirm new password
        </label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} />
        <Button type="submit" loading={pending} style={{ width: "100%" }}>
          Save password
        </Button>
      </form>
    </>
  );
}
