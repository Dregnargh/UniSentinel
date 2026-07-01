import { eq, sql } from "drizzle-orm";
import { orgUnits, users, workspaces } from "@unisentinel/db";
import { requireSession } from "@/platform/auth/session";
import { getDb } from "@/platform/db";
import { getReadiness } from "@/platform/readiness";
import { listAuditLog } from "@/platform/audit";
import { APP_VERSION } from "@/platform/version";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user } = await requireSession();
  const { db } = getDb();

  const [readiness, workspace, userCount, unitCount, recent] = await Promise.all([
    getReadiness(),
    db.select().from(workspaces).where(eq(workspaces.id, user.workspaceId)).limit(1),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.workspaceId, user.workspaceId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(orgUnits)
      .where(eq(orgUnits.workspaceId, user.workspaceId)),
    listAuditLog(user.workspaceId, { page: 1 }),
  ]);

  return (
    <HomeClient
      workspaceName={workspace[0]?.name ?? "Workspace"}
      email={user.email}
      version={APP_VERSION}
      ready={readiness.ready}
      workerHeartbeat={readiness.workerHeartbeat}
      memberCount={userCount[0]?.count ?? 0}
      orgUnitCount={unitCount[0]?.count ?? 0}
      auditTotal={recent.total}
      recent={recent.entries.slice(0, 8).map((e) => ({
        id: e.id,
        action: e.action,
        summary: e.summary,
        at: e.createdAt.toISOString(),
      }))}
    />
  );
}
