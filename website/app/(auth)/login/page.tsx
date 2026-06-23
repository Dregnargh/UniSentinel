"use client";

import { useActionState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { login, type AuthState } from "@/lib/auth/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className="auth__card">
      <Logo />
      <h1 className="auth__title">Welcome back</h1>
      <p className="auth__sub">Sign in to your UniSentinel workspace.</p>

      <form className="auth__form" action={action}>
        {state.error && <div className="auth__error">⚠ {state.error}</div>}
        <div className="field">
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </div>
        <button type="submit" className="btn btn-dark auth__submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth__demo">
        Demo login — <code>admin@unisentinel.com</code> / <code>UniSentinel!2026</code>
      </div>
      <p className="auth__alt">
        New to UniSentinel? <Link href="/register">Create an account</Link>
      </p>
    </div>
  );
}
