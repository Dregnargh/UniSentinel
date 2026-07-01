"use server";

import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { getUserByEmail } from "@/lib/auth/user";

export type ActionState = { ok?: boolean; error?: string };

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const USERS_PATH = "/app/settings/users";

/** Target user within the caller's workspace, or null. */
async function memberInWorkspace(userId: string, workspaceId: string) {
  const rows = await db
    .select({ id: users.id, role: users.role, active: users.active })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Count of active admins in a workspace — used to prevent removing the last one. */
async function activeAdminCount(workspaceId: string): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.workspaceId, workspaceId), eq(users.role, "admin"), eq(users.active, true)));
  return rows.length;
}

// ---- Create --------------------------------------------------------------

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(80),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
  role: z.enum(["admin", "member"]),
});

export async function createWorkspaceUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { workspaceId } = await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  if (await getUserByEmail(d.email)) return { error: "An account with that email already exists." };
  await db.insert(users).values({
    id: crypto.randomUUID(),
    workspaceId,
    name: d.name,
    email: d.email.toLowerCase(),
    passwordHash: await hashPassword(d.password),
    role: d.role,
    active: true,
    createdAt: new Date(),
  });
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Role ----------------------------------------------------------------

export async function updateUserRole(userId: string, role: string): Promise<ActionState> {
  const { session, workspaceId } = await requireAdmin();
  if (role !== "admin" && role !== "member") return { error: "Invalid role." };
  if (userId === session.sub) return { error: "You can't change your own role." };
  const target = await memberInWorkspace(userId, workspaceId);
  if (!target) return { error: "User not found." };
  if (target.role === "admin" && role === "member" && (await activeAdminCount(workspaceId)) <= 1) {
    return { error: "This is the last admin — promote someone else first." };
  }
  await db.update(users).set({ role }).where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)));
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Activate / deactivate ----------------------------------------------

export async function setUserActive(userId: string, active: boolean): Promise<ActionState> {
  const { session, workspaceId } = await requireAdmin();
  if (userId === session.sub) return { error: "You can't deactivate yourself." };
  const target = await memberInWorkspace(userId, workspaceId);
  if (!target) return { error: "User not found." };
  if (!active && target.role === "admin" && (await activeAdminCount(workspaceId)) <= 1) {
    return { error: "This is the last active admin — you can't deactivate them." };
  }
  await db.update(users).set({ active }).where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)));
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Reset password ------------------------------------------------------

const resetSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function resetUserPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { workspaceId } = await requireAdmin();
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await memberInWorkspace(parsed.data.userId, workspaceId);
  if (!target) return { error: "User not found." };
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(parsed.data.password) })
    .where(and(eq(users.id, parsed.data.userId), eq(users.workspaceId, workspaceId)));
  revalidatePath(USERS_PATH);
  return { ok: true };
}

// ---- Delete --------------------------------------------------------------

export async function deleteWorkspaceUser(userId: string): Promise<ActionState> {
  const { session, workspaceId } = await requireAdmin();
  if (userId === session.sub) return { error: "You can't delete yourself." };
  const target = await memberInWorkspace(userId, workspaceId);
  if (!target) return { error: "User not found." };
  if (target.role === "admin" && (await activeAdminCount(workspaceId)) <= 1) {
    return { error: "This is the last admin — you can't delete them." };
  }
  await db.delete(users).where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)));
  revalidatePath(USERS_PATH);
  return { ok: true };
}
