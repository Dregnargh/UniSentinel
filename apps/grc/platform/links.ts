import { and, eq } from "drizzle-orm";
import { entityLinks, type EntityLink } from "@unisentinel/db";
import { getDb } from "./db";
import { allEntityTypes } from "@/modules/registry";

// The uniform cross-module reference layer. Modules never hold raw FK columns
// into each other's tables — links live here, so "what references this?" and
// fallback-data promotion are one query shape everywhere.

export interface EntityRef {
  type: string; // "<module>:<entity>" from a manifest
  id: string;
}

function assertKnownType(type: string): void {
  if (!allEntityTypes().has(type)) throw new Error(`Unknown entity type: ${type}`);
}

export async function linkEntities(input: {
  workspaceId: string;
  source: EntityRef;
  target: EntityRef;
  kind?: string;
  createdBy?: string;
}): Promise<void> {
  assertKnownType(input.source.type);
  assertKnownType(input.target.type);
  const { db } = getDb();
  await db
    .insert(entityLinks)
    .values({
      id: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      sourceType: input.source.type,
      sourceId: input.source.id,
      targetType: input.target.type,
      targetId: input.target.id,
      linkKind: input.kind ?? "relates_to",
      createdBy: input.createdBy ?? null,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function unlinkEntities(input: {
  workspaceId: string;
  source: EntityRef;
  target: EntityRef;
  kind?: string;
}): Promise<void> {
  const { db } = getDb();
  await db
    .delete(entityLinks)
    .where(
      and(
        eq(entityLinks.workspaceId, input.workspaceId),
        eq(entityLinks.sourceType, input.source.type),
        eq(entityLinks.sourceId, input.source.id),
        eq(entityLinks.targetType, input.target.type),
        eq(entityLinks.targetId, input.target.id),
        eq(entityLinks.linkKind, input.kind ?? "relates_to"),
      ),
    );
}

export async function linksFrom(workspaceId: string, source: EntityRef): Promise<EntityLink[]> {
  const { db } = getDb();
  return db
    .select()
    .from(entityLinks)
    .where(
      and(
        eq(entityLinks.workspaceId, workspaceId),
        eq(entityLinks.sourceType, source.type),
        eq(entityLinks.sourceId, source.id),
      ),
    );
}

export async function linksTo(workspaceId: string, target: EntityRef): Promise<EntityLink[]> {
  const { db } = getDb();
  return db
    .select()
    .from(entityLinks)
    .where(
      and(
        eq(entityLinks.workspaceId, workspaceId),
        eq(entityLinks.targetType, target.type),
        eq(entityLinks.targetId, target.id),
      ),
    );
}
