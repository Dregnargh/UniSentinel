import { cache } from "react";
import { eq } from "drizzle-orm";
import { rolePermissions, userRoles } from "@unisentinel/db";
import { getDb } from "../db";

// A user's effective permission set = union of their roles' permissions,
// loaded FRESH per request (never from token claims) and deduped within a
// render pass via React cache().

export const getPermissionSet = cache(async (userId: string): Promise<Set<string>> => {
  const { db } = getDb();
  const rows = await db
    .select({ permission: rolePermissions.permission })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
    .where(eq(userRoles.userId, userId));
  return new Set(rows.map((r) => r.permission));
});
