// Risk ↔ Catalog / Tasks integration reads (server-only). Everything here
// reaches other modules ONLY through their designated provider functions and
// the entity_links layer — never their tables.
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { rskRisks, rskScopeItems, rskTreatmentActions } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { linksFrom } from "@/platform/links";
import { isModuleEnabled } from "@/platform/modules/entitlements";
import { findCatalogEntityByName, resolveCatalogEntities } from "@/modules/catalog/queries";
import { listTasksByOrigin } from "@/modules/tasks/queries";

export interface CatalogScopeLink {
  type: string;
  id: string;
  name: string;
  detail: string;
}

/** Catalog entities this risk affects (entity_links, kind "affects"). */
export async function getCatalogScope(workspaceId: string, riskId: string): Promise<CatalogScopeLink[]> {
  const links = (await linksFrom(workspaceId, { type: "risk:risk", id: riskId })).filter(
    (l) => l.linkKind === "affects" && l.targetType.startsWith("catalog:"),
  );
  if (links.length === 0) return [];
  const resolved = await resolveCatalogEntities(
    workspaceId,
    links.map((l) => ({ type: l.targetType, id: l.targetId })),
  );
  return links.map((l) => {
    const entity = resolved.get(`${l.targetType}:${l.targetId}`);
    return {
      type: l.targetType,
      id: l.targetId,
      name: entity?.name ?? "(no longer in the catalog)",
      detail: entity?.detail ?? "",
    };
  });
}

export interface LinkedTaskRow {
  id: string;
  title: string;
  status: string;
  assigneeName: string | null;
  dueDate: string | null;
}

/** Tasks-module tasks spawned from this risk (origin risk:risk). */
export async function getLinkedTasks(workspaceId: string, riskId: string): Promise<LinkedTaskRow[]> {
  return listTasksByOrigin(workspaceId, { type: "risk:risk", id: riskId });
}

export interface PromotionStatus {
  catalogLicensed: boolean;
  tasksLicensed: boolean;
  /** Unpromoted local scope items — only counted when catalog is licensed. */
  scope: number;
  /** Unpromoted local treatment actions — only counted when tasks is licensed. */
  treatments: number;
}

/** Workspace-wide "you have local data that could move into licensed modules". */
export async function promotionStatus(workspaceId: string): Promise<PromotionStatus> {
  const [catalogLicensed, tasksLicensed] = await Promise.all([
    isModuleEnabled(workspaceId, "catalog"),
    isModuleEnabled(workspaceId, "tasks"),
  ]);
  const { db } = getDb();
  let scope = 0;
  let treatments = 0;
  if (catalogLicensed) {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rskScopeItems)
      .where(and(eq(rskScopeItems.workspaceId, workspaceId), isNull(rskScopeItems.promotedTo)));
    scope = rows[0]?.count ?? 0;
  }
  if (tasksLicensed) {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rskTreatmentActions)
      .where(and(eq(rskTreatmentActions.workspaceId, workspaceId), isNull(rskTreatmentActions.promotedTo)));
    treatments = rows[0]?.count ?? 0;
  }
  return { catalogLicensed, tasksLicensed, scope, treatments };
}

export interface PromotableScopeItem {
  id: string;
  riskId: string;
  riskRef: string;
  riskTitle: string;
  name: string;
  kind: string;
  suggestion: { type: "catalog:service" | "catalog:asset"; id: string; name: string } | null;
}

/** Unpromoted scope items with exact-name catalog matches as suggestions. */
export async function listPromotableScope(workspaceId: string): Promise<PromotableScopeItem[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: rskScopeItems.id,
      riskId: rskScopeItems.riskId,
      riskRef: rskRisks.ref,
      riskTitle: rskRisks.title,
      name: rskScopeItems.name,
      kind: rskScopeItems.kind,
    })
    .from(rskScopeItems)
    .innerJoin(rskRisks, eq(rskScopeItems.riskId, rskRisks.id))
    .where(and(eq(rskScopeItems.workspaceId, workspaceId), isNull(rskScopeItems.promotedTo)))
    .orderBy(asc(rskRisks.ref), asc(rskScopeItems.createdAt));
  return Promise.all(
    rows.map(async (r) => ({ ...r, suggestion: await findCatalogEntityByName(workspaceId, r.name) })),
  );
}

export interface PromotableTreatment {
  id: string;
  riskId: string;
  riskRef: string;
  riskTitle: string;
  title: string;
  done: boolean;
  dueDate: string | null;
}

/** Unpromoted treatment actions, ready to become Tasks-module tasks. */
export async function listPromotableTreatments(workspaceId: string): Promise<PromotableTreatment[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: rskTreatmentActions.id,
      riskId: rskTreatmentActions.riskId,
      riskRef: rskRisks.ref,
      riskTitle: rskRisks.title,
      title: rskTreatmentActions.title,
      done: rskTreatmentActions.done,
      dueDate: rskTreatmentActions.dueDate,
    })
    .from(rskTreatmentActions)
    .innerJoin(rskRisks, eq(rskTreatmentActions.riskId, rskRisks.id))
    .where(and(eq(rskTreatmentActions.workspaceId, workspaceId), isNull(rskTreatmentActions.promotedTo)))
    .orderBy(asc(rskRisks.ref), asc(rskTreatmentActions.createdAt));
  return rows.map((r) => ({ ...r, dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null }));
}
