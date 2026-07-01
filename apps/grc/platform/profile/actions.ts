"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import QRCode from "qrcode";
import { sessions, users } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import { requireSession } from "../auth/session";
import { verifyPassword } from "../auth/password";
import {
  generateRecoveryCodes,
  generateTotpSecret,
  otpauthUrl,
  verifyTotp,
} from "../auth/totp";
import type { ActionState } from "../auth/actions";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const PROFILE_PATH = "/profile";

// ---- Profile ------------------------------------------------------------------

const nameSchema = z.object({ name: z.string().trim().min(2, "Name is too short.").max(80) });

export async function updateProfileName(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireSession();
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { db } = getDb();
  await db.update(users).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(users.id, user.id));
  await logAudit({
    workspaceId: user.workspaceId,
    actor: { id: user.id, name: parsed.data.name, email: user.email },
    action: "user.profile_updated",
    entityType: "user",
    entityId: user.id,
    summary: `${user.email} renamed their profile from “${user.name}” to “${parsed.data.name}”.`,
  });
  revalidatePath(PROFILE_PATH);
  return { ok: true };
}

// ---- TOTP enrollment ------------------------------------------------------------

export interface TotpEnrollment {
  secret: string;
  otpauth: string;
  qrDataUrl: string;
}

/** Stores a PENDING secret (enabled=false) and returns QR material to display. */
export async function beginTotpEnrollment(): Promise<TotpEnrollment | { error: string }> {
  const { user } = await requireSession();
  if (user.totpEnabled) return { error: "Two-factor authentication is already enabled." };
  const secret = generateTotpSecret();
  const { db } = getDb();
  await db
    .update(users)
    .set({ totpSecret: secret, totpEnabled: false, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  const otpauth = otpauthUrl("UniSentinel", user.email, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth, { margin: 1, width: 220 });
  return { secret, otpauth, qrDataUrl };
}

const confirmSchema = z.object({ code: z.string().trim().min(6, "Enter the 6-digit code.") });

export type ConfirmTotpState = ActionState & { recoveryCodes?: string[] };

export async function confirmTotpEnrollment(
  _prev: ConfirmTotpState,
  formData: FormData,
): Promise<ConfirmTotpState> {
  const { user } = await requireSession();
  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { db } = getDb();
  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const me = rows[0];
  if (!me?.totpSecret || me.totpEnabled) return { error: "Start enrollment again." };
  if (!verifyTotp(me.totpSecret, parsed.data.code)) return { error: "That code isn't valid — try again." };

  const { plain, hashes } = generateRecoveryCodes();
  await db
    .update(users)
    .set({ totpEnabled: true, totpRecoveryCodes: hashes, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await logAudit({
    workspaceId: user.workspaceId,
    actor: { id: user.id, name: user.name, email: user.email },
    action: "user.totp_enabled",
    entityType: "user",
    entityId: user.id,
    summary: `${user.email} enabled two-factor authentication.`,
  });
  revalidatePath(PROFILE_PATH);
  return { ok: true, recoveryCodes: plain };
}

const disableSchema = z.object({ password: z.string().min(1, "Enter your password.") });

export async function disableTotp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user } = await requireSession();
  const parsed = disableSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { db } = getDb();
  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const me = rows[0];
  if (!me) return { error: "Account not found." };
  if (!(await verifyPassword(parsed.data.password, me.passwordHash))) {
    return { error: "Password is incorrect." };
  }
  await db
    .update(users)
    .set({ totpSecret: null, totpEnabled: false, totpRecoveryCodes: null, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await logAudit({
    workspaceId: user.workspaceId,
    actor: { id: user.id, name: user.name, email: user.email },
    action: "user.totp_disabled",
    entityType: "user",
    entityId: user.id,
    summary: `${user.email} disabled two-factor authentication.`,
  });
  revalidatePath(PROFILE_PATH);
  return { ok: true };
}

// ---- Sessions -----------------------------------------------------------------

export interface OwnSession {
  id: string;
  createdAt: Date;
  lastSeenAt: Date;
  ip: string | null;
  userAgent: string | null;
  current: boolean;
}

export async function listOwnSessions(): Promise<OwnSession[]> {
  const ctx = await requireSession();
  const { db } = getDb();
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, ctx.user.id), isNull(sessions.revokedAt)))
    .orderBy(desc(sessions.lastSeenAt));
  return rows
    .filter((r) => r.expiresAt > new Date())
    .map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      lastSeenAt: r.lastSeenAt,
      ip: r.ip,
      userAgent: r.userAgent,
      current: r.id === ctx.sessionId,
    }));
}

export async function revokeOwnSession(sessionId: string): Promise<ActionState> {
  const ctx = await requireSession();
  const { db } = getDb();
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, ctx.user.id)))
    .limit(1);
  if (!rows[0]) return { error: "Session not found." };
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, sessionId));
  await logAudit({
    workspaceId: ctx.user.workspaceId,
    actor: { id: ctx.user.id, name: ctx.user.name, email: ctx.user.email },
    action: "user.session_revoked",
    entityType: "user",
    entityId: ctx.user.id,
    summary: `${ctx.user.email} revoked one of their sessions.`,
  });
  revalidatePath(PROFILE_PATH);
  return { ok: true };
}
