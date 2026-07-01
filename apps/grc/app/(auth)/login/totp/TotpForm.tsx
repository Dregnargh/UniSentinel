"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert, Button, Input } from "@unisentinel/ui";
import { totpLogin, type ActionState } from "@/platform/auth/actions";

export function TotpForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(totpLogin, {});
  return (
    <>
      <h1 className="auth__title">Two-factor authentication</h1>
      <p className="auth__sub">Enter the 6-digit code from your authenticator app, or a recovery code.</p>
      <form action={action} className="auth__form">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <label className="auth__label" htmlFor="code">
          Code
        </label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          required
          placeholder="123456"
        />
        <Button type="submit" loading={pending} style={{ width: "100%" }}>
          Verify
        </Button>
      </form>
      <p className="auth__foot">
        <Link href="/login">Back to sign in</Link>
      </p>
    </>
  );
}
