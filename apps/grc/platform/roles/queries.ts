import { and, asc, eq, sql } from "drizzle-orm";
import { rolePermissions, roles, userRoles, users } from "@unisentinel/db";
import { getDb } from "../db";
import { ADMINISTRATOR } from "./system";

export interface RoleSummary {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  memberCount: number;
}

export async function listRoles(workspaceId: string): Promise<RoleSummary[]> {
  const { db } = getDb();
  const [roleRows, permRows, memberRows] = await Promise.all([
    db.select().from(roles).where(eq(roles.workspaceId, workspaceId)).orderBy(asc(roles.createdAt)),
    db
      .select({ roleId: rolePermissions.roleId, permission: rolePermissions.permission })
      .from(rolePermissions)
      .innerJoin(roles, eq(rolePermissions.roleId, roles.id))
      .where(eq(roles.workspaceId, workspaceId)),
    db
      .select({ roleId: userRoles.roleId, count: sql<number>`count(*)::int` })
      .from(userRoles)
      .where(eq(userRoles.workspaceId, workspaceId))
      .groupBy(userRoles.roleId),
  ]);
  const permsByRole = new Map<string, string[]>();
  for (const p of permRows) {
    (permsByRole.get(p.roleId) ?? permsByRole.set(p.roleId, []).get(p.roleId)!).push(p.permission);
  }
  const membersByRole = new Map(memberRows.map((m) => [m.roleId, m.count]));
  return roleRows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: permsByRole.get(r.id) ?? [],
    memberCount: membersByRole.get(r.id) ?? 0,
  }));
}

export async function roleInWorkspace(roleId: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(roles)
    .where(and(eq(roles.id, roleId), eq(roles.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Role names per user for the users screen. */
export async function rolesByUser(workspaceId: string): Promise<Map<string, { id: string; name: string }[]>> {
  const { db } = getDb();
  const rows = await db
    .select({ userId: userRoles.userId, roleId: roles.id, name: roles.name })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.workspaceId, workspaceId))
    .orderBy(asc(roles.name));
  const map = new Map<string, { id: string; name: string }[]>();
  for (const r of rows) {
    (map.get(r.userId) ?? map.set(r.userId, []).get(r.userId)!).push({ id: r.roleId, name: r.name });
  }
  return map;
}

/** The workspace's Administrator system role id. */
export async function administratorRoleId(workspaceId: string): Promise<string | null> {
  const { db } = getDb();
  const rows = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.workspaceId, workspaceId), eq(roles.isSystem, true), eq(roles.name, ADMINISTRATOR)))
    .limit(1);
  return rows[0]?.id ?? null;
}

/** Active users currently holding the Administrator system role. */
export async function countActiveAdministrators(workspaceId: string): Promise<number> {
  const { db } = getDb();
  const adminId = await administratorRoleId(workspaceId);
  if (!adminId) return 0;
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .where(and(eq(userRoles.roleId, adminId), eq(users.active, true)));
  return rows[0]?.count ?? 0;
}

/** Does this user hold the Administrator system role? */
export async function isAdministrator(workspaceId: string, userId: string): Promise<boolean> {
  const { db } = getDb();
  const adminId = await administratorRoleId(workspaceId);
  if (!adminId) return false;
  const rows = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(and(eq(userRoles.roleId, adminId), eq(userRoles.userId, userId)))
    .limit(1);
  return rows.length > 0;
}
