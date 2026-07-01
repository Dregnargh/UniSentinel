"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { users } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import { requireAdmin } from "../auth/session";
import { hashPassword, passwordSchema } from "../auth/password";
import type { ActionState } from "../auth/actions";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const USERS_PATH = "/settings/users";

async function memberInWorkspace(userId: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

async function activeAdminCount(workspaceId: string): Promise<number> {
  const { db } = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.workspaceId, workspaceId), eq(users.role, "admin"), eq(users.active, true)));
  return rows.length;
}

// ---- Create (invite with temp password) ------------------------------------

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(80),
  email: z.string().trim().email("Enter a valid email."),
  password: passwordSchema,
  role: z.enum(["admin", "member"]),
});

export async function createWorkspaceUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { db } = getDb();
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, d.email.toLowerCase())).limit(1);
  if (existing.length > 0) return { error: "An account with that email already exists." };

  const now = new Date();
  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    workspaceId: actor.workspaceId,
    name: d.name,
    email: d.email.toLowerCase(),
    passwordHash: await hashPassword(d.password),
    role: d.role,
    active: true,
    mustChangePassword: true, // temp password — forced change on first login
    createdAt: now,
    updatedAt: now,
  });
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "user.created",
    entityType: "user",
    entityId: id,
    summary: `Created ${d.role} account for ${d.email.toLowerCase()}.`,
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Role -------------------------------------------------------------------

export async function updateUserRole(userId: string, role: string): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  if (role !== "admin" && role !== "member") return { error: "Invalid role." };
  if (userId === actor.id) return { error: "You can't change your own role." };
  const target = await memberInWorkspace(userId, actor.workspaceId);
  if (!target) return { error: "User not found." };
  if (target.role === "admin" && role === "member" && (await activeAdminCount(actor.workspaceId)) <= 1) {
    return { error: "This is the last admin — promote someone else first." };
  }
  const { db } = getDb();
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "user.role_changed",
    entityType: "user",
    entityId: userId,
    summary: `Changed ${target.email} from ${target.role} to ${role}.`,
    diff: { before: { role: target.role }, after: { role } },
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Activate / deactivate ----------------------------------------------------

export async function setUserActive(userId: string, active: boolean): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  if (userId === actor.id) return { error: "You can't deactivate yourself." };
  const target = await memberInWorkspace(userId, actor.workspaceId);
  if (!target) return { error: "User not found." };
  if (!active && target.role === "admin" && (await activeAdminCount(actor.workspaceId)) <= 1) {
    return { error: "This is the last active admin — you can't deactivate them." };
  }
  const { db } = getDb();
  await db.update(users).set({ active, updatedAt: new Date() }).where(eq(users.id, userId));
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: active ? "user.activated" : "user.deactivated",
    entityType: "user",
    entityId: userId,
    summary: `${active ? "Activated" : "Deactivated"} ${target.email}.`,
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Reset password -------------------------------------------------------------

const resetSchema = z.object({ userId: z.string().min(1), password: passwordSchema });

export async function resetUserPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await memberInWorkspace(parsed.data.userId, actor.workspaceId);
  if (!target) return { error: "User not found." };
  const { db } = getDb();
  await db
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, parsed.data.userId));
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "user.password_reset",
    entityType: "user",
    entityId: target.id,
    summary: `Reset the password for ${target.email} (change forced on next sign-in).`,
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Delete ----------------------------------------------------------------------

export async function deleteWorkspaceUser(userId: string): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  if (userId === actor.id) return { error: "You can't delete yourself." };
  const target = await memberInWorkspace(userId, actor.workspaceId);
  if (!target) return { error: "User not found." };
  if (target.role === "admin" && target.active && (await activeAdminCount(actor.workspaceId)) <= 1) {
    return { error: "This is the last admin — promote someone else first." };
  }
  const { db } = getDb();
  await db.delete(users).where(eq(users.id, userId));
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "user.deleted",
    entityType: "user",
    entityId: userId,
    summary: `Deleted the account of ${target.email}.`,
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}
