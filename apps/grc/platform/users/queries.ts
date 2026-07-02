import { asc, eq } from "drizzle-orm";
import { users } from "@unisentinel/db";
import { getDb } from "../db";

/** Password-hash-free projection for the admin users screen. */
export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  createdAt: Date;
}

export async function listWorkspaceUsers(workspaceId: string): Promise<WorkspaceUser[]> {
  const { db } = getDb();
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      totpEnabled: users.totpEnabled,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.workspaceId, workspaceId))
    .orderBy(asc(users.createdAt));
}
