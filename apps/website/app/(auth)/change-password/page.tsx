"use client";

import { useActionState } from "react";
import Logo from "@/components/Logo";
import { changePassword, type AuthState } from "@/lib/auth/actions";

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePassword, {});

  return (
    <div className="auth__card">
      <Logo />
      <h1 className="auth__title">Set a new password</h1>
      <p className="auth__sub">Choose a new password to finish signing in.</p>

      <form className="auth__form" action={action}>
        {state.error && <div className="auth__error">⚠ {state.error}</div>}
        <div className="field">
          <label htmlFor="password">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} placeholder="Re-enter password" />
        </div>
        <button type="submit" className="btn btn-dark auth__submit" disabled={pending}>
          {pending ? "Saving…" : "Set password & continue"}
        </button>
      </form>
    </div>
  );
}
