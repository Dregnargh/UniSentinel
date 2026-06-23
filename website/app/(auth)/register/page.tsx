"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { register, type AuthState } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, {});

  return (
    <div className="auth__card">
      <Logo />
      <h1 className="auth__title">Create your workspace</h1>
      <p className="auth__sub">Start running GRC + ERP on one platform.</p>

      <form className="auth__form" action={action}>
        {state.error && <div className="auth__error">⚠ {state.error}</div>}
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" type="text" autoComplete="name" required placeholder="Ada Auditor" />
        </div>
        <div className="field">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
        </div>
        <button type="submit" className="btn btn-primary auth__submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth__alt">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
