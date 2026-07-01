import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionUser,
} from "./jwt";

export async function createSession(u: {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
}): Promise<void> {
  const token = await signSession(u);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const c = (await cookies()).get(SESSION_COOKIE);
  if (!c?.value) return null;
  return verifySession(c.value);
}

/** Session or bust — redirects to /login when unauthenticated. Use in /app pages. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Session + resolved workspace id. Prefers the `wsid` claim; falls back to a DB
 * lookup for tokens issued before workspaces existed. Redirects if neither works.
 */
export async function requireWorkspace(): Promise<{ session: SessionUser; workspaceId: string }> {
  const session = await requireSession();
  if (session.wsid) return { session, workspaceId: session.wsid };
  const rows = await db
    .select({ workspaceId: users.workspaceId })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);
  const workspaceId = rows[0]?.workspaceId;
  if (!workspaceId) redirect("/login");
  return { session, workspaceId };
}

/** Fresh admin check from the DB (so role/active changes take effect immediately). */
export async function requireAdmin(): Promise<{ session: SessionUser; workspaceId: string }> {
  const { session, workspaceId } = await requireWorkspace();
  const rows = await db
    .select({ role: users.role, active: users.active })
    .from(users)
    .where(eq(users.id, session.sub))
    .limit(1);
  const me = rows[0];
  if (!me || !me.active || me.role !== "admin") redirect("/app");
  return { session, workspaceId };
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
