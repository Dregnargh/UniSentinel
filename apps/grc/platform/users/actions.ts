"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { users } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import { guardAction } from "../rbac/guard";
import { P } from "../rbac/catalog";
import { hashPassword, passwordSchema } from "../auth/password";
import { countActiveAdministrators, isAdministrator } from "../roles/queries";
import { assignRole } from "../roles/system";
import { roles } from "@unisentinel/db";
import type { ActionState } from "../auth/actions";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const USERS_PATH = "/settings/users";

async function memberInWorkspace(userId: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, active: users.active })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Would removing/deactivating this user leave the workspace without an active Administrator? */
async function wouldRemoveLastAdministrator(workspaceId: string, userId: string): Promise<boolean> {
  if (!(await isAdministrator(workspaceId, userId))) return false;
  return (await countActiveAdministrators(workspaceId)) <= 1;
}

// ---- Create (invite with temp password; gets the Member system role) ---------

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(80),
  email: z.string().trim().email("Enter a valid email."),
  password: passwordSchema,
});

export async function createWorkspaceUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.usersCreate);
  if ("error" in gate) return gate;
  const actor = gate.user;
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { db } = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, d.email.toLowerCase()))
    .limit(1);
  if (existing.length > 0) return { error: "An account with that email already exists." };

  const now = new Date();
  const id = crypto.randomUUID();
  const memberRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.workspaceId, actor.workspaceId), eq(roles.isSystem, true), eq(roles.name, "Member")))
    .limit(1);
  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id,
      workspaceId: actor.workspaceId,
      name: d.name,
      email: d.email.toLowerCase(),
      passwordHash: await hashPassword(d.password),
      active: true,
      mustChangePassword: true, // temp password — forced change on first login
      createdAt: now,
      updatedAt: now,
    });
    if (memberRole[0]) await assignRole(tx, actor.workspaceId, id, memberRole[0].id);
  });
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "user.created",
    entityType: "user",
    entityId: id,
    summary: `Created an account for ${d.email.toLowerCase()} (Member role).`,
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Activate / deactivate ----------------------------------------------------

export async function setUserActive(userId: string, active: boolean): Promise<ActionState> {
  const gate = await guardAction(P.usersEdit);
  if ("error" in gate) return gate;
  const actor = gate.user;
  if (userId === actor.id) return { error: "You can't deactivate yourself." };
  const target = await memberInWorkspace(userId, actor.workspaceId);
  if (!target) return { error: "User not found." };
  if (!active && (await wouldRemoveLastAdministrator(actor.workspaceId, userId))) {
    return { error: "This is the last active administrator — you can't deactivate them." };
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
  const gate = await guardAction(P.usersResetPassword);
  if ("error" in gate) return gate;
  const actor = gate.user;
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
  const gate = await guardAction(P.usersDelete);
  if ("error" in gate) return gate;
  const actor = gate.user;
  if (userId === actor.id) return { error: "You can't delete yourself." };
  const target = await memberInWorkspace(userId, actor.workspaceId);
  if (!target) return { error: "User not found." };
  if (target.active && (await wouldRemoveLastAdministrator(actor.workspaceId, userId))) {
    return { error: "This is the last administrator — grant Administrator to someone else first." };
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
