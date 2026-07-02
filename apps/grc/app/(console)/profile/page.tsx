import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { roles, userRoles } from "@unisentinel/db";
import { requireSession } from "@/platform/auth/session";
import { getDb } from "@/platform/db";
import { listOwnSessions } from "@/platform/profile/actions";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "My profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { user } = await requireSession();
  const { db } = getDb();
  const [sessions, roleRows] = await Promise.all([
    listOwnSessions(),
    db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id)),
  ]);
  return (
    <ProfileClient
      user={{
        name: user.name,
        email: user.email,
        roleNames: roleRows.map((r) => r.name),
        totpEnabled: user.totpEnabled,
        emailNotifications: user.emailNotifications,
      }}
      sessions={sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        lastSeenAt: s.lastSeenAt.toISOString(),
      }))}
    />
  );
}
