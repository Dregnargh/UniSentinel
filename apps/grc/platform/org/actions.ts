"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { orgUnits } from "@unisentinel/db";
import { getDb } from "../db";
import { logAudit } from "../audit";
import { requireAdmin } from "../auth/session";
import type { ActionState } from "../auth/actions";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const ORG_PATH = "/settings/org-units";

const KINDS = ["company", "business_line", "department", "team"] as const;

async function unitInWorkspace(id: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(orgUnits)
    .where(and(eq(orgUnits.id, id), eq(orgUnits.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

const createSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(120),
  kind: z.enum(KINDS),
  parentId: z.string().optional(),
});

export async function createOrgUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;

  let parentId: string | null = null;
  if (d.parentId) {
    const parent = await unitInWorkspace(d.parentId, actor.workspaceId);
    if (!parent) return { error: "Parent unit not found." };
    parentId = parent.id;
  }

  const { db } = getDb();
  const id = crypto.randomUUID();
  await db.insert(orgUnits).values({
    id,
    workspaceId: actor.workspaceId,
    parentId,
    name: d.name,
    kind: d.kind,
    createdAt: new Date(),
  });
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "org_unit.created",
    entityType: "org_unit",
    entityId: id,
    summary: `Created ${d.kind.replace("_", " ")} “${d.name}”.`,
  });
  revalidatePath(ORG_PATH);
  return { ok: true };
}

const updateSchema = z.object({
  unitId: z.string().min(1),
  name: z.string().trim().min(2, "Name is too short.").max(120),
  kind: z.enum(KINDS),
});

export async function updateOrgUnit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await unitInWorkspace(parsed.data.unitId, actor.workspaceId);
  if (!target) return { error: "Unit not found." };

  const { db } = getDb();
  await db
    .update(orgUnits)
    .set({ name: parsed.data.name, kind: parsed.data.kind })
    .where(eq(orgUnits.id, target.id));
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "org_unit.updated",
    entityType: "org_unit",
    entityId: target.id,
    summary: `Updated org unit “${target.name}”.`,
    diff: {
      before: { name: target.name, kind: target.kind },
      after: { name: parsed.data.name, kind: parsed.data.kind },
    },
  });
  revalidatePath(ORG_PATH);
  return { ok: true };
}

export async function deleteOrgUnit(unitId: string): Promise<ActionState> {
  const { user: actor } = await requireAdmin();
  const target = await unitInWorkspace(unitId, actor.workspaceId);
  if (!target) return { error: "Unit not found." };

  const { db } = getDb();
  const children = await db
    .select({ id: orgUnits.id })
    .from(orgUnits)
    .where(and(eq(orgUnits.parentId, unitId), eq(orgUnits.workspaceId, actor.workspaceId)))
    .limit(1);
  if (children.length > 0) return { error: "Move or delete its sub-units first." };

  await db.delete(orgUnits).where(eq(orgUnits.id, unitId));
  await logAudit({
    workspaceId: actor.workspaceId,
    actor: { id: actor.id, name: actor.name, email: actor.email },
    action: "org_unit.deleted",
    entityType: "org_unit",
    entityId: unitId,
    summary: `Deleted org unit “${target.name}”.`,
  });
  revalidatePath(ORG_PATH);
  return { ok: true };
}
