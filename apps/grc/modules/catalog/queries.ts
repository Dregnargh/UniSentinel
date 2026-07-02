import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  catAssets,
  catDataFlows,
  catRelationships,
  catServices,
  orgUnits,
  users,
  type CatAsset,
  type CatDataFlow,
  type CatRelationship,
} from "@unisentinel/db";
import { getDb } from "@/platform/db";

export interface ServiceRow {
  id: string;
  name: string;
  description: string;
  criticality: string;
  status: string;
  ownerName: string | null;
  orgUnitName: string | null;
}

export async function listServices(workspaceId: string): Promise<ServiceRow[]> {
  const { db } = getDb();
  const rows = await db
    .select({
      id: catServices.id,
      name: catServices.name,
      description: catServices.description,
      criticality: catServices.criticality,
      status: catServices.status,
      ownerName: users.name,
      orgUnitName: orgUnits.name,
      ownerUserId: catServices.ownerUserId,
      orgUnitId: catServices.orgUnitId,
    })
    .from(catServices)
    .leftJoin(users, eq(catServices.ownerUserId, users.id))
    .leftJoin(orgUnits, eq(catServices.orgUnitId, orgUnits.id))
    .where(eq(catServices.workspaceId, workspaceId))
    .orderBy(asc(catServices.name));
  return rows;
}

export async function listAssets(workspaceId: string): Promise<(CatAsset & { ownerName: string | null })[]> {
  const { db } = getDb();
  const rows = await db
    .select({ asset: catAssets, ownerName: users.name })
    .from(catAssets)
    .leftJoin(users, eq(catAssets.ownerUserId, users.id))
    .where(eq(catAssets.workspaceId, workspaceId))
    .orderBy(asc(catAssets.name));
  return rows.map((r) => ({ ...r.asset, ownerName: r.ownerName }));
}

export async function listRelationships(workspaceId: string): Promise<CatRelationship[]> {
  const { db } = getDb();
  return db
    .select()
    .from(catRelationships)
    .where(eq(catRelationships.workspaceId, workspaceId))
    .orderBy(asc(catRelationships.createdAt));
}

export async function listDataFlows(workspaceId: string): Promise<CatDataFlow[]> {
  const { db } = getDb();
  return db
    .select()
    .from(catDataFlows)
    .where(eq(catDataFlows.workspaceId, workspaceId))
    .orderBy(asc(catDataFlows.createdAt));
}

export async function serviceInWorkspace(id: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(catServices)
    .where(and(eq(catServices.id, id), eq(catServices.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function assetInWorkspace(id: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(catAssets)
    .where(and(eq(catAssets.id, id), eq(catAssets.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export interface CatalogStats {
  services: number;
  assets: number;
  assetsByType: Record<string, number>;
  relationships: number;
  dataFlows: number;
}

export async function catalogStats(workspaceId: string): Promise<CatalogStats> {
  const { db } = getDb();
  const [services, byType, rels, flows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(catServices)
      .where(eq(catServices.workspaceId, workspaceId)),
    db
      .select({ type: catAssets.type, count: sql<number>`count(*)::int` })
      .from(catAssets)
      .where(eq(catAssets.workspaceId, workspaceId))
      .groupBy(catAssets.type),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(catRelationships)
      .where(eq(catRelationships.workspaceId, workspaceId)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(catDataFlows)
      .where(eq(catDataFlows.workspaceId, workspaceId)),
  ]);
  const assetsByType = Object.fromEntries(byType.map((r) => [r.type, r.count]));
  return {
    services: services[0]?.count ?? 0,
    assets: byType.reduce((n, r) => n + r.count, 0),
    assetsByType,
    relationships: rels[0]?.count ?? 0,
    dataFlows: flows[0]?.count ?? 0,
  };
}

/**
 * The "scope-entities" integration point: search catalog entities for
 * consumers (Risk scope picker, Assessments targeting, Audits universe).
 */
export async function searchCatalogEntities(
  workspaceId: string,
  query: string,
  limit = 20,
): Promise<{ type: "catalog:service" | "catalog:asset"; id: string; name: string; detail: string }[]> {
  const { db } = getDb();
  const like = `%${query.toLowerCase()}%`;
  const [services, assets] = await Promise.all([
    db
      .select({ id: catServices.id, name: catServices.name, detail: catServices.criticality })
      .from(catServices)
      .where(and(eq(catServices.workspaceId, workspaceId), sql`lower(${catServices.name}) LIKE ${like}`))
      .limit(limit),
    db
      .select({ id: catAssets.id, name: catAssets.name, detail: catAssets.type })
      .from(catAssets)
      .where(and(eq(catAssets.workspaceId, workspaceId), sql`lower(${catAssets.name}) LIKE ${like}`))
      .limit(limit),
  ]);
  return [
    ...services.map((s) => ({ type: "catalog:service" as const, id: s.id, name: s.name, detail: `service · ${s.detail}` })),
    ...assets.map((a) => ({ type: "catalog:asset" as const, id: a.id, name: a.name, detail: `asset · ${a.detail}` })),
  ].slice(0, limit);
}

/** Provider surface: resolve catalog refs ("catalog:service"/"catalog:asset" + id) to names. */
export async function resolveCatalogEntities(
  workspaceId: string,
  refs: { type: string; id: string }[],
): Promise<Map<string, { name: string; detail: string }>> {
  const { db } = getDb();
  const serviceIds = refs.filter((r) => r.type === "catalog:service").map((r) => r.id);
  const assetIds = refs.filter((r) => r.type === "catalog:asset").map((r) => r.id);
  const out = new Map<string, { name: string; detail: string }>();
  if (serviceIds.length) {
    const rows = await db
      .select({ id: catServices.id, name: catServices.name, criticality: catServices.criticality })
      .from(catServices)
      .where(and(eq(catServices.workspaceId, workspaceId), inArray(catServices.id, serviceIds)));
    for (const r of rows) out.set(`catalog:service:${r.id}`, { name: r.name, detail: `service · ${r.criticality}` });
  }
  if (assetIds.length) {
    const rows = await db
      .select({ id: catAssets.id, name: catAssets.name, type: catAssets.type })
      .from(catAssets)
      .where(and(eq(catAssets.workspaceId, workspaceId), inArray(catAssets.id, assetIds)));
    for (const r of rows) out.set(`catalog:asset:${r.id}`, { name: r.name, detail: `asset · ${r.type}` });
  }
  return out;
}

/** Provider surface: exact-name match for promotion suggestions. */
export async function findCatalogEntityByName(
  workspaceId: string,
  name: string,
): Promise<{ type: "catalog:service" | "catalog:asset"; id: string; name: string } | null> {
  const { db } = getDb();
  const lower = name.trim().toLowerCase();
  const services = await db
    .select({ id: catServices.id, name: catServices.name })
    .from(catServices)
    .where(and(eq(catServices.workspaceId, workspaceId), sql`lower(${catServices.name}) = ${lower}`))
    .limit(1);
  if (services[0]) return { type: "catalog:service", id: services[0].id, name: services[0].name };
  const assets = await db
    .select({ id: catAssets.id, name: catAssets.name })
    .from(catAssets)
    .where(and(eq(catAssets.workspaceId, workspaceId), sql`lower(${catAssets.name}) = ${lower}`))
    .limit(1);
  if (assets[0]) return { type: "catalog:asset", id: assets[0].id, name: assets[0].name };
  return null;
}
