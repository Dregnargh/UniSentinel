"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@unisentinel/ui";
import { setupInstance, type ActionState } from "@/platform/auth/actions";

export function SetupForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(setupInstance, {});
  return (
    <>
      <h1 className="auth__title">Set up your instance</h1>
      <p className="auth__sub">Name your organization and create the first administrator account.</p>
      <form action={action} className="auth__form">
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        <label className="auth__label" htmlFor="workspaceName">
          Organization name
        </label>
        <Input id="workspaceName" name="workspaceName" required placeholder="Acme Corporation" />
        <label className="auth__label" htmlFor="name">
          Your name
        </label>
        <Input id="name" name="name" autoComplete="name" required placeholder="Jane Smith" />
        <label className="auth__label" htmlFor="email">
          Work email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        <label className="auth__label" htmlFor="password">
          Password
        </label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
        <label className="auth__label" htmlFor="confirm">
          Confirm password
        </label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={12} />
        <Button type="submit" loading={pending} style={{ width: "100%" }}>
          Create administrator
        </Button>
      </form>
    </>
  );
}
