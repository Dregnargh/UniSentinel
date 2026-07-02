import { eq, sql } from "drizzle-orm";
import { orgUnits, users, workspaces } from "@unisentinel/db";
import { requireSession } from "@/platform/auth/session";
import { getDb } from "@/platform/db";
import { getReadiness } from "@/platform/readiness";
import { listAuditLog } from "@/platform/audit";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { P, permitted } from "@/platform/rbac/catalog";
import { availableWidgets, resolveDashboard } from "@/platform/dashboards/data";
import { APP_VERSION } from "@/platform/version";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user } = await requireSession();
  const { db } = getDb();
  const permissions = await getPermissionSet(user.id);
  // The recent-activity feed is audit data — same gate as /settings/audit-log.
  const canSeeAudit = permitted(permissions, P.auditView);

  const [readiness, workspace, userCount, unitCount, recent, dashboard, widgetDefs] = await Promise.all([
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
    canSeeAudit ? listAuditLog(user.workspaceId, { page: 1 }) : null,
    resolveDashboard(user.workspaceId, user.id, permissions),
    availableWidgets(user.workspaceId, permissions),
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
      audit={
        recent
          ? {
              total: recent.total,
              entries: recent.entries.slice(0, 8).map((e) => ({
                id: e.id,
                action: e.action,
                summary: e.summary,
                at: e.createdAt.toISOString(),
              })),
            }
          : null
      }
      dashboard={{
        widgets: dashboard.widgets,
        available: widgetDefs.map((w) => ({ key: w.key, title: w.title, moduleName: w.moduleName })),
      }}
    />
  );
}
