import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { sessions, users } from "@unisentinel/db";
import { getDb } from "../db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSessionToken, verifySessionToken } from "./jwt";

// Node-runtime session layer. The cookie is a signed pointer; every request
// resolves it against the sessions + users tables, so revocation, deactivation
// and role changes take effect immediately (never trust token claims).

export interface CurrentUser {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
  totpEnabled: boolean;
}

export interface SessionContext {
  user: CurrentUser;
  sessionId: string;
}

export async function createSession(userId: string): Promise<void> {
  const { db } = getDb();
  const h = await headers();
  const now = new Date();
  const sessionId = crypto.randomUUID();
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_MAX_AGE * 1000),
    lastSeenAt: now,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  });
  const token = await signSessionToken(userId, sessionId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSession(): Promise<SessionContext | null> {
  const c = (await cookies()).get(SESSION_COOKIE);
  if (!c?.value) return null;
  const token = await verifySessionToken(c.value);
  if (!token) return null;

  const { db } = getDb();
  const rows = await db
    .select({
      sessionId: sessions.id,
      lastSeenAt: sessions.lastSeenAt,
      id: users.id,
      workspaceId: users.workspaceId,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      totpEnabled: users.totpEnabled,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.id, token.sid),
        eq(sessions.userId, token.sub),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row || !row.active) return null;

  // Throttled activity stamp (at most every 5 minutes) for the sessions UI.
  if (Date.now() - row.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await db
      .update(sessions)
      .set({ lastSeenAt: new Date() })
      .where(eq(sessions.id, row.sessionId))
      .catch(() => {});
  }

  return {
    sessionId: row.sessionId,
    user: {
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      email: row.email,
      role: row.role,
      mustChangePassword: row.mustChangePassword,
      totpEnabled: row.totpEnabled,
    },
  };
}

/** Session or bust — redirects to /login when unauthenticated. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSession();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Admin or bust. Role comes from the fresh DB read in getSession(). */
export async function requireAdmin(): Promise<SessionContext> {
  const ctx = await requireSession();
  if (ctx.user.role !== "admin") redirect("/");
  return ctx;
}

export async function destroySession(): Promise<void> {
  const ctx = await getSession();
  if (ctx) {
    const { db } = getDb();
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, ctx.sessionId))
      .catch(() => {});
  }
  (await cookies()).delete(SESSION_COOKIE);
}
