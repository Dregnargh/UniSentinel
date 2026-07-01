import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/** Safe (no password hash) view of a workspace member for the admin UI. */
export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

export function listWorkspaceUsers(workspaceId: string): Promise<WorkspaceUser[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.workspaceId, workspaceId))
    .orderBy(asc(users.createdAt));
}
