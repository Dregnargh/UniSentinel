import { roles, rolePermissions, userRoles } from "@unisentinel/db";
import type { Db } from "@unisentinel/db";

export const ADMINISTRATOR = "Administrator";
export const MEMBER = "Member";

/**
 * Seeds the per-workspace system roles. Called inside the setup-wizard
 * transaction for new workspaces (existing ones were backfilled by
 * migration 0004). Returns the role ids so the caller can assign them.
 */
export async function createSystemRoles(
  tx: Db | Parameters<Parameters<Db["transaction"]>[0]>[0],
  workspaceId: string,
): Promise<{ adminRoleId: string; memberRoleId: string }> {
  const now = new Date();
  const adminRoleId = crypto.randomUUID();
  const memberRoleId = crypto.randomUUID();
  await tx.insert(roles).values([
    {
      id: adminRoleId,
      workspaceId,
      name: ADMINISTRATOR,
      description: "Full access to everything, including permissions added by future modules.",
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: memberRoleId,
      workspaceId,
      name: MEMBER,
      description: "Baseline access: personal profile and licensed module content, no administration.",
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await tx.insert(rolePermissions).values({ id: crypto.randomUUID(), roleId: adminRoleId, permission: "*" });
  return { adminRoleId, memberRoleId };
}

export async function assignRole(
  tx: Db | Parameters<Parameters<Db["transaction"]>[0]>[0],
  workspaceId: string,
  userId: string,
  roleId: string,
): Promise<void> {
  await tx
    .insert(userRoles)
    .values({ id: crypto.randomUUID(), workspaceId, userId, roleId, createdAt: new Date() })
    .onConflictDoNothing();
}
