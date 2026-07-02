"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { catAssets, catDataFlows, catRelationships, catServices, orgUnits, users } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { logAudit } from "@/platform/audit";
import { emitEvent } from "@/platform/events";
import { moduleGuardAction } from "@/platform/modules/guard";
import type { ActionState } from "@/platform/auth/actions";
import {
  ASSET_TYPES,
  CLASSIFICATIONS,
  CRITICALITIES,
  ENTITY_STATUSES,
  RELATIONSHIP_KINDS,
} from "./format";
import { parseAssetCsv } from "./csv";
import { assetInWorkspace, serviceInWorkspace } from "./queries";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const MODULE = "catalog";
const P_SERVICES = "catalog.services.manage";
const P_ASSETS = "catalog.assets.manage";
const P_IMPORT = "catalog.assets.import";

function revalidateCatalog(page: string) {
  revalidatePath(page);
  revalidatePath("/m/catalog");
  revalidatePath("/m/catalog/map");
}

async function optionalUserInWorkspace(userId: string | undefined, workspaceId: string): Promise<string | null> {
  if (!userId) return null;
  const { db } = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)))
    .limit(1);
  return rows[0]?.id ?? null;
}

// ---- Services ----------------------------------------------------------------

const serviceSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  criticality: z.enum(CRITICALITIES),
  status: z.enum(ENTITY_STATUSES),
  ownerUserId: z.string().optional(),
  orgUnitId: z.string().optional(),
});

export async function saveService(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_SERVICES);
  if ("error" in gate) return gate;
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { db } = getDb();

  const ownerUserId = await optionalUserInWorkspace(d.ownerUserId || undefined, gate.user.workspaceId);
  let orgUnitId: string | null = null;
  if (d.orgUnitId) {
    const rows = await db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(and(eq(orgUnits.id, d.orgUnitId), eq(orgUnits.workspaceId, gate.user.workspaceId)))
      .limit(1);
    orgUnitId = rows[0]?.id ?? null;
  }

  const serviceId = String(formData.get("serviceId") ?? "");
  const now = new Date();
  if (serviceId) {
    const target = await serviceInWorkspace(serviceId, gate.user.workspaceId);
    if (!target) return { error: "Service not found." };
    await db
      .update(catServices)
      .set({ name: d.name, description: d.description, criticality: d.criticality, status: d.status, ownerUserId, orgUnitId, updatedAt: now })
      .where(eq(catServices.id, serviceId));
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "catalog.service_updated",
      entityType: "catalog:service",
      entityId: serviceId,
      summary: `Updated service “${d.name}”.`,
      diff: { before: { name: target.name, criticality: target.criticality, status: target.status }, after: d },
    });
  } else {
    const id = crypto.randomUUID();
    await db.insert(catServices).values({
      id,
      workspaceId: gate.user.workspaceId,
      name: d.name,
      description: d.description,
      criticality: d.criticality,
      status: d.status,
      ownerUserId,
      orgUnitId,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "catalog.service_created",
      entityType: "catalog:service",
      entityId: id,
      summary: `Created service “${d.name}” (${d.criticality}).`,
    });
  }
  revalidateCatalog("/m/catalog/services");
  return { ok: true };
}

export async function deleteService(serviceId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_SERVICES);
  if ("error" in gate) return gate;
  const target = await serviceInWorkspace(serviceId, gate.user.workspaceId);
  if (!target) return { error: "Service not found." };
  const { db } = getDb();
  await db.transaction(async (tx) => {
    await tx
      .delete(catRelationships)
      .where(
        and(
          eq(catRelationships.workspaceId, gate.user.workspaceId),
          eq(catRelationships.sourceKind, "service"),
          eq(catRelationships.sourceId, serviceId),
        ),
      );
    await tx
      .delete(catRelationships)
      .where(
        and(
          eq(catRelationships.workspaceId, gate.user.workspaceId),
          eq(catRelationships.targetKind, "service"),
          eq(catRelationships.targetId, serviceId),
        ),
      );
    await tx.delete(catServices).where(eq(catServices.id, serviceId));
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "catalog.service_deleted",
    entityType: "catalog:service",
    entityId: serviceId,
    summary: `Deleted service “${target.name}” (and its connections).`,
  });
  revalidateCatalog("/m/catalog/services");
  return { ok: true };
}

// ---- Assets ------------------------------------------------------------------

const assetSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  type: z.enum(ASSET_TYPES),
  description: z.string().trim().max(2000).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  classification: z.enum(CLASSIFICATIONS),
  status: z.enum(ENTITY_STATUSES),
  ownerUserId: z.string().optional(),
});

function attributesFromForm(formData: FormData): Record<string, string> {
  const keys = formData.getAll("attrKey").map(String);
  const values = formData.getAll("attrValue").map(String);
  const attributes: Record<string, string> = {};
  keys.forEach((key, i) => {
    const k = key.trim();
    const v = (values[i] ?? "").trim();
    if (k && v) attributes[k] = v;
  });
  return attributes;
}

export async function saveAsset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ASSETS);
  if ("error" in gate) return gate;
  const parsed = assetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { db } = getDb();
  const ownerUserId = await optionalUserInWorkspace(d.ownerUserId || undefined, gate.user.workspaceId);
  const attributes = attributesFromForm(formData);
  const assetId = String(formData.get("assetId") ?? "");
  const now = new Date();

  if (assetId) {
    const target = await assetInWorkspace(assetId, gate.user.workspaceId);
    if (!target) return { error: "Asset not found." };
    await db
      .update(catAssets)
      .set({ ...d, ownerUserId, attributes, updatedAt: now })
      .where(eq(catAssets.id, assetId));
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "catalog.asset_updated",
      entityType: "catalog:asset",
      entityId: assetId,
      summary: `Updated asset “${d.name}” (${d.type}).`,
      diff: { before: { name: target.name, type: target.type, classification: target.classification }, after: d },
    });
    await emitEvent({
      workspaceId: gate.user.workspaceId,
      type: "catalog.asset.updated",
      payload: { assetId, name: d.name, assetType: d.type },
      actorUserId: gate.user.id,
    });
  } else {
    const id = crypto.randomUUID();
    await db.insert(catAssets).values({
      id,
      workspaceId: gate.user.workspaceId,
      ...d,
      ownerUserId,
      attributes,
      createdAt: now,
      updatedAt: now,
    });
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "catalog.asset_created",
      entityType: "catalog:asset",
      entityId: id,
      summary: `Created asset “${d.name}” (${d.type}, ${d.classification}).`,
    });
    await emitEvent({
      workspaceId: gate.user.workspaceId,
      type: "catalog.asset.created",
      payload: { assetId: id, name: d.name, assetType: d.type },
      actorUserId: gate.user.id,
    });
  }
  revalidateCatalog("/m/catalog/assets");
  return { ok: true };
}

export async function deleteAsset(assetId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ASSETS);
  if ("error" in gate) return gate;
  const target = await assetInWorkspace(assetId, gate.user.workspaceId);
  if (!target) return { error: "Asset not found." };
  const { db } = getDb();
  await db.transaction(async (tx) => {
    for (const [kindCol, idCol] of [
      [catRelationships.sourceKind, catRelationships.sourceId],
      [catRelationships.targetKind, catRelationships.targetId],
    ] as const) {
      await tx
        .delete(catRelationships)
        .where(
          and(eq(catRelationships.workspaceId, gate.user.workspaceId), eq(kindCol, "asset"), eq(idCol, assetId)),
        );
    }
    await tx.delete(catAssets).where(eq(catAssets.id, assetId));
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "catalog.asset_deleted",
    entityType: "catalog:asset",
    entityId: assetId,
    summary: `Deleted asset “${target.name}” (and its connections).`,
  });
  revalidateCatalog("/m/catalog/assets");
  return { ok: true };
}

// ---- CSV import ------------------------------------------------------------------

export type ImportState = ActionState & { imported?: number; skipped?: string[]; problems?: string[] };

export async function importAssetsCsv(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const gate = await moduleGuardAction(MODULE, P_IMPORT);
  if ("error" in gate) return gate;
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file." };
  if (file.size > 2 * 1024 * 1024) return { error: "CSV must be 2 MB or smaller." };

  const { rows, errors } = parseAssetCsv(await file.text());
  const problems = [...errors];
  const { db } = getDb();
  const existing = await db
    .select({ name: catAssets.name, type: catAssets.type })
    .from(catAssets)
    .where(eq(catAssets.workspaceId, gate.user.workspaceId));
  const existingKeys = new Set(existing.map((a) => `${a.name.toLowerCase()}|${a.type}`));

  const skipped: string[] = [];
  let imported = 0;
  const now = new Date();
  for (const row of rows) {
    if (!ASSET_TYPES.includes(row.type as (typeof ASSET_TYPES)[number])) {
      problems.push(`"${row.name}": unknown type "${row.type}".`);
      continue;
    }
    if (!CLASSIFICATIONS.includes(row.classification as (typeof CLASSIFICATIONS)[number])) {
      problems.push(`"${row.name}": unknown classification "${row.classification}".`);
      continue;
    }
    const key = `${row.name.toLowerCase()}|${row.type}`;
    if (existingKeys.has(key)) {
      skipped.push(row.name);
      continue;
    }
    existingKeys.add(key);
    const id = crypto.randomUUID();
    await db.insert(catAssets).values({
      id,
      workspaceId: gate.user.workspaceId,
      name: row.name,
      type: row.type,
      description: row.description,
      location: row.location,
      classification: row.classification,
      status: "active",
      ownerUserId: null,
      attributes: row.attributes,
      createdAt: now,
      updatedAt: now,
    });
    await emitEvent({
      workspaceId: gate.user.workspaceId,
      type: "catalog.asset.created",
      payload: { assetId: id, name: row.name, assetType: row.type, source: "csv" },
      actorUserId: gate.user.id,
    });
    imported++;
  }
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "catalog.assets_imported",
    entityType: "catalog:asset",
    summary: `Imported ${imported} asset${imported === 1 ? "" : "s"} from CSV (${skipped.length} duplicate${skipped.length === 1 ? "" : "s"} skipped, ${problems.length} problem${problems.length === 1 ? "" : "s"}).`,
  });
  revalidateCatalog("/m/catalog/assets");
  return { ok: true, imported, skipped, problems };
}

// ---- Relationships & data flows ------------------------------------------------

const endpointSchema = z.object({
  sourceRef: z.string().min(1, "Pick a source."), // "<kind>:<id>"
  targetRef: z.string().min(1, "Pick a target."),
});

async function resolveEndpoint(ref: string, workspaceId: string): Promise<{ kind: string; id: string; name: string } | null> {
  const [kind, id] = ref.split(":");
  if (!kind || !id) return null;
  if (kind === "service") {
    const s = await serviceInWorkspace(id, workspaceId);
    return s ? { kind, id, name: s.name } : null;
  }
  if (kind === "asset") {
    const a = await assetInWorkspace(id, workspaceId);
    return a ? { kind, id, name: a.name } : null;
  }
  return null;
}

const relationshipSchema = endpointSchema.extend({ kind: z.enum(RELATIONSHIP_KINDS) });

export async function createRelationship(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ASSETS);
  if ("error" in gate) return gate;
  const parsed = relationshipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const source = await resolveEndpoint(parsed.data.sourceRef, gate.user.workspaceId);
  const target = await resolveEndpoint(parsed.data.targetRef, gate.user.workspaceId);
  if (!source || !target) return { error: "Source or target not found." };
  if (source.kind === target.kind && source.id === target.id) return { error: "Source and target must differ." };

  const { db } = getDb();
  await db
    .insert(catRelationships)
    .values({
      id: crypto.randomUUID(),
      workspaceId: gate.user.workspaceId,
      sourceKind: source.kind,
      sourceId: source.id,
      targetKind: target.kind,
      targetId: target.id,
      kind: parsed.data.kind,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "catalog.relationship_created",
    entityType: "catalog:asset",
    summary: `Connected “${source.name}” ${parsed.data.kind.replace("_", " ")} “${target.name}”.`,
  });
  revalidateCatalog("/m/catalog/connections");
  return { ok: true };
}

export async function deleteRelationship(relationshipId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ASSETS);
  if ("error" in gate) return gate;
  const { db } = getDb();
  await db
    .delete(catRelationships)
    .where(and(eq(catRelationships.id, relationshipId), eq(catRelationships.workspaceId, gate.user.workspaceId)));
  revalidateCatalog("/m/catalog/connections");
  return { ok: true };
}

const dataFlowSchema = endpointSchema.extend({
  name: z.string().trim().max(120).optional().default(""),
  dataClassification: z.enum(CLASSIFICATIONS),
  protocol: z.string().trim().max(60).optional().default(""),
});

export async function createDataFlow(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ASSETS);
  if ("error" in gate) return gate;
  const parsed = dataFlowSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const source = await resolveEndpoint(parsed.data.sourceRef, gate.user.workspaceId);
  const target = await resolveEndpoint(parsed.data.targetRef, gate.user.workspaceId);
  if (!source || !target) return { error: "Source or target not found." };

  const { db } = getDb();
  await db.insert(catDataFlows).values({
    id: crypto.randomUUID(),
    workspaceId: gate.user.workspaceId,
    sourceKind: source.kind,
    sourceId: source.id,
    targetKind: target.kind,
    targetId: target.id,
    name: parsed.data.name,
    dataClassification: parsed.data.dataClassification,
    protocol: parsed.data.protocol,
    createdAt: new Date(),
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "catalog.data_flow_created",
    entityType: "catalog:asset",
    summary: `Data flow: “${source.name}” → “${target.name}” (${parsed.data.dataClassification}${parsed.data.protocol ? `, ${parsed.data.protocol}` : ""}).`,
  });
  revalidateCatalog("/m/catalog/connections");
  return { ok: true };
}

export async function deleteDataFlow(flowId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_ASSETS);
  if ("error" in gate) return gate;
  const { db } = getDb();
  await db
    .delete(catDataFlows)
    .where(and(eq(catDataFlows.id, flowId), eq(catDataFlows.workspaceId, gate.user.workspaceId)));
  revalidateCatalog("/m/catalog/connections");
  return { ok: true };
}
