"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rolePermissions, roles, userRoles, users } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import { guardAction } from "../rbac/guard";
import { P, isValidPermission } from "../rbac/catalog";
import { notify } from "../notify/service";
import type { ActionState } from "../auth/actions";
import {
  administratorRoleId,
  countActiveAdministrators,
  isAdministrator,
  roleInWorkspace,
} from "./queries";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const ROLES_PATH = "/settings/roles";
const USERS_PATH = "/settings/users";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name is too short.").max(60),
  description: z.string().trim().max(300).optional().default(""),
});

function parsePermissions(formData: FormData): string[] | { error: string } {
  const perms = formData.getAll("perm").map(String);
  const unique = [...new Set(perms)];
  for (const p of unique) {
    if (!isValidPermission(p)) return { error: `Unknown permission: ${p}` };
  }
  return unique;
}

// ---- Create / update / delete roles -----------------------------------------

export async function createRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.rolesManage);
  if ("error" in gate) return gate;
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const perms = parsePermissions(formData);
  if ("error" in perms) return perms;
  if (perms.length === 0) return { error: "Select at least one permission." };

  const { db } = getDb();
  const existing = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.workspaceId, gate.user.workspaceId), eq(roles.name, parsed.data.name)))
    .limit(1);
  if (existing.length > 0) return { error: "A role with that name already exists." };

  const now = new Date();
  const roleId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(roles).values({
      id: roleId,
      workspaceId: gate.user.workspaceId,
      name: parsed.data.name,
      description: parsed.data.description,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    });
    await tx
      .insert(rolePermissions)
      .values(perms.map((p) => ({ id: crypto.randomUUID(), roleId, permission: p })));
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "role.created",
    entityType: "role",
    entityId: roleId,
    summary: `Created role “${parsed.data.name}” with ${perms.length} permission${perms.length === 1 ? "" : "s"}.`,
    diff: { after: { name: parsed.data.name, permissions: perms } },
  });
  revalidatePath(ROLES_PATH);
  return { ok: true };
}

export async function updateRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.rolesManage);
  if ("error" in gate) return gate;
  const roleId = String(formData.get("roleId") ?? "");
  const target = await roleInWorkspace(roleId, gate.user.workspaceId);
  if (!target) return { error: "Role not found." };
  if (target.isSystem) return { error: "System roles can't be edited." };

  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const perms = parsePermissions(formData);
  if ("error" in perms) return perms;
  if (perms.length === 0) return { error: "Select at least one permission." };

  const { db } = getDb();
  const before = await db
    .select({ permission: rolePermissions.permission })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));
  await db.transaction(async (tx) => {
    await tx
      .update(roles)
      .set({ name: parsed.data.name, description: parsed.data.description, updatedAt: new Date() })
      .where(eq(roles.id, roleId));
    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    await tx
      .insert(rolePermissions)
      .values(perms.map((p) => ({ id: crypto.randomUUID(), roleId, permission: p })));
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "role.updated",
    entityType: "role",
    entityId: roleId,
    summary: `Updated role “${parsed.data.name}”.`,
    diff: {
      before: { name: target.name, permissions: before.map((p) => p.permission) },
      after: { name: parsed.data.name, permissions: perms },
    },
  });
  revalidatePath(ROLES_PATH);
  return { ok: true };
}

export async function deleteRole(roleId: string): Promise<ActionState> {
  const gate = await guardAction(P.rolesManage);
  if ("error" in gate) return gate;
  const target = await roleInWorkspace(roleId, gate.user.workspaceId);
  if (!target) return { error: "Role not found." };
  if (target.isSystem) return { error: "System roles can't be deleted." };

  const { db } = getDb();
  const assigned = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(eq(userRoles.roleId, roleId))
    .limit(1);
  if (assigned.length > 0) return { error: "Unassign this role from all users first." };

  await db.delete(roles).where(eq(roles.id, roleId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "role.deleted",
    entityType: "role",
    entityId: roleId,
    summary: `Deleted role “${target.name}”.`,
  });
  revalidatePath(ROLES_PATH);
  return { ok: true };
}

// ---- Assign roles to a user ---------------------------------------------------

export async function setUserRoles(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await guardAction(P.usersEdit);
  if ("error" in gate) return gate;
  const userId = String(formData.get("userId") ?? "");
  const roleIds = [...new Set(formData.getAll("roleId").map(String))];

  const { db } = getDb();
  const targetRows = await db
    .select({ id: users.id, name: users.name, email: users.email, active: users.active })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.workspaceId, gate.user.workspaceId)))
    .limit(1);
  const target = targetRows[0];
  if (!target) return { error: "User not found." };

  // All requested roles must belong to this workspace.
  const validRoles = roleIds.length
    ? await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(and(eq(roles.workspaceId, gate.user.workspaceId), inArray(roles.id, roleIds)))
    : [];
  if (validRoles.length !== roleIds.length) return { error: "Unknown role in selection." };

  // Last-administrator guardrail: this change may not remove the final active
  // holder of the Administrator system role.
  const adminId = await administratorRoleId(gate.user.workspaceId);
  if (adminId && target.active && (await isAdministrator(gate.user.workspaceId, userId))) {
    const stillAdmin = roleIds.includes(adminId);
    if (!stillAdmin && (await countActiveAdministrators(gate.user.workspaceId)) <= 1) {
      return { error: "This is the last administrator — grant Administrator to someone else first." };
    }
  }

  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.userId, userId));
    if (roleIds.length) {
      await tx.insert(userRoles).values(
        roleIds.map((roleId) => ({
          id: crypto.randomUUID(),
          workspaceId: gate.user.workspaceId,
          userId,
          roleId,
          createdAt: new Date(),
        })),
      );
    }
  });

  const roleNames = validRoles.map((r) => r.name).join(", ") || "none";
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "user.roles_changed",
    entityType: "user",
    entityId: userId,
    summary: `Set the roles of ${target.email} to: ${roleNames}.`,
    diff: { after: { roles: validRoles.map((r) => r.name) } },
  });
  if (userId !== gate.user.id) {
    await notify({
      workspaceId: gate.user.workspaceId,
      userIds: [userId],
      type: "role.assigned",
      title: "Your roles changed",
      body: `${gate.user.name} set your roles to: ${roleNames}.`,
      href: "/profile",
    });
  }
  revalidatePath(USERS_PATH);
  return { ok: true };
}
