// The "catalog-provision" integration point: other modules create catalog
// entities through this (the Risk promotion wizard, importers, connectors) —
// never by writing cat_* tables directly. Server-only. Unlike spawnTask, this
// writes its own catalog.* audit entry: the catalog module owns the record of
// how its entities came to exist. The CALLER is still responsible for its own
// module/permission gating.
import { catAssets, catServices } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { logAudit } from "@/platform/audit";
import { ASSET_TYPES, type AssetType } from "./format";

export async function provisionCatalogEntity(input: {
  workspaceId: string;
  kind: "service" | "asset";
  name: string;
  description?: string;
  assetType?: string;
  actor: { id: string; name: string; email: string };
  source: string; // e.g. "risk promotion" — recorded in the audit summary
}): Promise<{ type: "catalog:service" | "catalog:asset"; id: string }> {
  const { db } = getDb();
  const id = crypto.randomUUID();
  const now = new Date();
  if (input.kind === "service") {
    await db.insert(catServices).values({
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description ?? "",
      criticality: "medium",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({
      workspaceId: input.workspaceId,
      actor: input.actor,
      action: "catalog.service_created",
      entityType: "catalog:service",
      entityId: id,
      summary: `Created service “${input.name}” (via ${input.source}).`,
    });
    return { type: "catalog:service", id };
  }
  const type: AssetType = (ASSET_TYPES as readonly string[]).includes(input.assetType ?? "")
    ? (input.assetType as AssetType)
    : "software";
  await db.insert(catAssets).values({
    id,
    workspaceId: input.workspaceId,
    name: input.name,
    type,
    description: input.description ?? "",
    createdAt: now,
    updatedAt: now,
  });
  await logAudit({
    workspaceId: input.workspaceId,
    actor: input.actor,
    action: "catalog.asset_created",
    entityType: "catalog:asset",
    entityId: id,
    summary: `Created asset “${input.name}” (${type}, via ${input.source}).`,
  });
  return { type: "catalog:asset", id };
}
