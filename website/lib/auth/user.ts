import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, workspaces, type User, type Workspace } from "@/lib/db/schema";

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const row: Workspace = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date(),
  };
  await db.insert(workspaces).values(row);
  return row;
}

export async function createUser(input: {
  workspaceId: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
  active?: boolean;
}): Promise<User> {
  const row: User = {
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    role: input.role ?? "member",
    active: input.active ?? true,
    createdAt: new Date(),
  };
  await db.insert(users).values(row);
  return row;
}
