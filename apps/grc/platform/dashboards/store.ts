// Dashboard persistence (server-only). A row exists only once the user has
// customized — until then the caller serves the computed default layout, so
// newly licensed modules surface widgets without touching stored data.
import { and, eq } from "drizzle-orm";
import { dashboards, type DashboardWidgetInstance } from "@unisentinel/db";
import { getDb } from "@/platform/db";

export async function getSavedLayout(
  workspaceId: string,
  ownerUserId: string,
): Promise<DashboardWidgetInstance[] | null> {
  const { db } = getDb();
  const rows = await db
    .select({ layout: dashboards.layout })
    .from(dashboards)
    .where(and(eq(dashboards.workspaceId, workspaceId), eq(dashboards.ownerUserId, ownerUserId)))
    .limit(1);
  return rows[0]?.layout ?? null;
}

export async function saveLayout(
  workspaceId: string,
  ownerUserId: string,
  layout: DashboardWidgetInstance[],
): Promise<void> {
  const { db } = getDb();
  const now = new Date();
  await db
    .insert(dashboards)
    .values({ id: crypto.randomUUID(), workspaceId, ownerUserId, layout, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [dashboards.workspaceId, dashboards.ownerUserId],
      set: { layout, updatedAt: now },
    });
}
