"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { users, workspaces } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import {
  TOTP_PENDING_COOKIE,
  TOTP_PENDING_MAX_AGE,
  signTotpPendingToken,
  verifyTotpPendingToken,
} from "./jwt";
import {
  LOCKOUT_MINUTES,
  MAX_FAILED_LOGINS,
  hashPassword,
  passwordSchema,
  verifyPassword,
} from "./password";
import { hashRecoveryCode, verifyTotp } from "./totp";
import { createSession, destroySession, requireSession } from "./session";

export type ActionState = { ok?: boolean; error?: string };

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";

/** Sanitizes a user-supplied post-login path (must be a local absolute path). */
function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function instanceHasUsers(): Promise<boolean> {
  const { db } = getDb();
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  return (rows[0]?.count ?? 0) > 0;
}

// ---- First-run setup wizard -------------------------------------------------

const setupSchema = z
  .object({
    workspaceName: z.string().trim().min(2, "Organization name is too short.").max(120),
    name: z.string().trim().min(2, "Your name is too short.").max(80),
    email: z.string().trim().email("Enter a valid email."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

export async function setupInstance(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (await instanceHasUsers()) return { error: "This instance is already set up." };
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  const { db } = getDb();
  const now = new Date();
  const workspaceId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(workspaces).values({ id: workspaceId, name: d.workspaceName, createdAt: now });
    await tx.insert(users).values({
      id: userId,
      workspaceId,
      name: d.name,
      email: d.email.toLowerCase(),
      passwordHash: await hashPassword(d.password),
      role: "admin",
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });
  await logAudit({
    workspaceId,
    actor: { id: userId, name: d.name, email: d.email.toLowerCase() },
    action: "instance.setup",
    entityType: "workspace",
    entityId: workspaceId,
    summary: `Instance set up — workspace “${d.workspaceName}” created with first administrator ${d.email.toLowerCase()}.`,
  });
  await createSession(userId);
  redirect("/");
}

// ---- Login (password -> optional TOTP challenge) -----------------------------

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { email, password } = parsed.data;
  const next = safeNext(parsed.data.next);
  const generic = { error: "Invalid email or password." };

  const { db } = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  const user = rows[0];
  if (!user || !user.active) return generic;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    return { error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= MAX_FAILED_LOGINS;
    await db
      .update(users)
      .set({
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null,
      })
      .where(eq(users.id, user.id));
    if (lock) {
      await logAudit({
        workspaceId: user.workspaceId,
        actor: { id: user.id, name: user.name, email: user.email },
        action: "auth.lockout",
        entityType: "user",
        entityId: user.id,
        summary: `Account locked for ${LOCKOUT_MINUTES} minutes after ${MAX_FAILED_LOGINS} failed sign-in attempts.`,
      });
    }
    return generic;
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await db.update(users).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id));
  }

  if (user.totpEnabled) {
    const token = await signTotpPendingToken(user.id, next);
    (await cookies()).set(TOTP_PENDING_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOTP_PENDING_MAX_AGE,
    });
    redirect("/login/totp");
  }

  await logAudit({
    workspaceId: user.workspaceId,
    actor: { id: user.id, name: user.name, email: user.email },
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
    summary: `${user.email} signed in.`,
  });
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/change-password" : next);
}

const totpLoginSchema = z.object({
  code: z.string().trim().min(1, "Enter the 6-digit code or a recovery code."),
});

export async function totpLogin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const jar = await cookies();
  const pending = jar.get(TOTP_PENDING_COOKIE)?.value;
  const token = pending ? await verifyTotpPendingToken(pending) : null;
  if (!token) return { error: "Your sign-in expired — start again." };

  const parsed = totpLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const code = parsed.data.code;

  const { db } = getDb();
  const rows = await db.select().from(users).where(eq(users.id, token.sub)).limit(1);
  const user = rows[0];
  if (!user || !user.active || !user.totpEnabled || !user.totpSecret) {
    return { error: "Your sign-in expired — start again." };
  }

  let valid = verifyTotp(user.totpSecret, code);
  let usedRecovery = false;
  if (!valid && user.totpRecoveryCodes?.length) {
    const digest = hashRecoveryCode(code);
    if (user.totpRecoveryCodes.includes(digest)) {
      valid = true;
      usedRecovery = true;
      await db
        .update(users)
        .set({ totpRecoveryCodes: user.totpRecoveryCodes.filter((h) => h !== digest) })
        .where(eq(users.id, user.id));
    }
  }
  if (!valid) return { error: "That code isn't valid." };

  jar.delete(TOTP_PENDING_COOKIE);
  await logAudit({
    workspaceId: user.workspaceId,
    actor: { id: user.id, name: user.name, email: user.email },
    action: usedRecovery ? "auth.login_recovery_code" : "auth.login",
    entityType: "user",
    entityId: user.id,
    summary: usedRecovery
      ? `${user.email} signed in with a recovery code (${user.totpRecoveryCodes!.length - 1} left).`
      : `${user.email} signed in (2FA).`,
  });
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/change-password" : safeNext(token.next));
}

// ---- Logout / change password -------------------------------------------------

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireSession();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { db } = getDb();
  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const me = rows[0];
  if (!me) redirect("/login");
  if (!(await verifyPassword(parsed.data.current, me.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  await logAudit({
    workspaceId: user.workspaceId,
    actor: { id: user.id, name: user.name, email: user.email },
    action: "auth.password_changed",
    entityType: "user",
    entityId: user.id,
    summary: `${user.email} changed their password.`,
  });
  redirect("/");
}
