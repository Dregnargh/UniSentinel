"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { orgUnits, rskAssessments, rskRisks, rskScopeItems, rskTreatmentActions, users } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { logAudit } from "@/platform/audit";
import { emitEvent } from "@/platform/events";
import { moduleGuardAction } from "@/platform/modules/guard";
import type { ActionState } from "@/platform/auth/actions";
import {
  bandFor,
  methodologySchema,
  riskScore,
  shrinkConflict,
  validateMethodology,
} from "./methodology";
import { getMethodology, saveMethodology } from "./methodology-store";
import { highestLevelsInUse, nextRef, riskInWorkspace } from "./queries";

const firstError = (e: z.ZodError): string => e.issues[0]?.message ?? "Please check the form.";
const MODULE = "risk";
const P_MANAGE = "risk.risks.manage";
const P_APPROVE = "risk.risks.approve";
const P_DELETE = "risk.risks.delete";
const P_METHODOLOGY = "risk.methodology.manage";

const RISK_STATUSES = ["draft", "assessed", "in_treatment", "accepted", "closed"] as const;
const STRATEGIES = ["mitigate", "accept", "transfer", "avoid"] as const;

function revalidateRisk(riskId?: string) {
  for (const p of ["/m/risk", "/m/risk/register", "/m/risk/heatmap"]) revalidatePath(p);
  if (riskId) revalidatePath(`/m/risk/register/${riskId}`);
}

async function levelWithin(workspaceId: string, likelihood: number, impact: number): Promise<string | null> {
  const m = await getMethodology(workspaceId);
  if (likelihood < 1 || likelihood > m.likelihood.length) return `Likelihood must be 1–${m.likelihood.length}.`;
  if (impact < 1 || impact > m.impact.length) return `Impact must be 1–${m.impact.length}.`;
  return null;
}

// ---- Create / edit ------------------------------------------------------------

const riskSchema = z.object({
  title: z.string().trim().min(2, "Title is too short.").max(180),
  description: z.string().trim().max(4000).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  ownerUserId: z.string().optional(),
  orgUnitId: z.string().optional(),
  inherentLikelihood: z.coerce.number().int().min(1),
  inherentImpact: z.coerce.number().int().min(1),
});

export async function saveRisk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const parsed = riskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const levelError = await levelWithin(gate.user.workspaceId, d.inherentLikelihood, d.inherentImpact);
  if (levelError) return { error: levelError };

  const { db } = getDb();
  let ownerUserId: string | null = null;
  if (d.ownerUserId) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, d.ownerUserId), eq(users.workspaceId, gate.user.workspaceId)))
      .limit(1);
    ownerUserId = rows[0]?.id ?? null;
  }
  let orgUnitId: string | null = null;
  if (d.orgUnitId) {
    const rows = await db
      .select({ id: orgUnits.id })
      .from(orgUnits)
      .where(and(eq(orgUnits.id, d.orgUnitId), eq(orgUnits.workspaceId, gate.user.workspaceId)))
      .limit(1);
    orgUnitId = rows[0]?.id ?? null;
  }

  const riskId = String(formData.get("riskId") ?? "");
  const now = new Date();
  const m = await getMethodology(gate.user.workspaceId);
  const band = bandFor(riskScore(d.inherentLikelihood, d.inherentImpact), m);

  if (riskId) {
    const target = await riskInWorkspace(riskId, gate.user.workspaceId);
    if (!target) return { error: "Risk not found." };
    const assessmentChanged =
      target.inherentLikelihood !== d.inherentLikelihood || target.inherentImpact !== d.inherentImpact;
    await db
      .update(rskRisks)
      .set({
        title: d.title,
        description: d.description,
        category: d.category,
        ownerUserId,
        orgUnitId,
        inherentLikelihood: d.inherentLikelihood,
        inherentImpact: d.inherentImpact,
        status: target.status === "draft" ? "assessed" : target.status,
        updatedAt: now,
      })
      .where(eq(rskRisks.id, riskId));
    if (assessmentChanged) {
      await db.insert(rskAssessments).values({
        id: crypto.randomUUID(),
        workspaceId: gate.user.workspaceId,
        riskId,
        kind: "inherent",
        likelihood: d.inherentLikelihood,
        impact: d.inherentImpact,
        note: "Re-assessed",
        assessedByName: gate.user.name,
        createdAt: now,
      });
    }
    await logAudit({
      workspaceId: gate.user.workspaceId,
      actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
      action: "risk.updated",
      entityType: "risk:risk",
      entityId: riskId,
      summary: `Updated risk ${target.ref} “${d.title}” (inherent ${d.inherentLikelihood}×${d.inherentImpact}, ${band}).`,
    });
    revalidateRisk(riskId);
    return { ok: true };
  }

  const id = crypto.randomUUID();
  const ref = await nextRef(gate.user.workspaceId);
  await db.insert(rskRisks).values({
    id,
    workspaceId: gate.user.workspaceId,
    ref,
    title: d.title,
    description: d.description,
    category: d.category,
    status: "assessed",
    ownerUserId,
    orgUnitId,
    inherentLikelihood: d.inherentLikelihood,
    inherentImpact: d.inherentImpact,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(rskAssessments).values({
    id: crypto.randomUUID(),
    workspaceId: gate.user.workspaceId,
    riskId: id,
    kind: "inherent",
    likelihood: d.inherentLikelihood,
    impact: d.inherentImpact,
    note: "Initial assessment",
    assessedByName: gate.user.name,
    createdAt: now,
  });
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.created",
    entityType: "risk:risk",
    entityId: id,
    summary: `Created risk ${ref} “${d.title}” (inherent ${d.inherentLikelihood}×${d.inherentImpact}, ${band}).`,
  });
  await emitEvent({
    workspaceId: gate.user.workspaceId,
    type: "risk.created",
    payload: { riskId: id, ref, title: d.title, band },
    actorUserId: gate.user.id,
  });
  revalidateRisk(id);
  return { ok: true };
}

// ---- Residual assessment -------------------------------------------------------

const residualSchema = z.object({
  riskId: z.string().min(1),
  likelihood: z.coerce.number().int().min(1),
  impact: z.coerce.number().int().min(1),
  note: z.string().trim().max(500).optional().default(""),
});

export async function assessResidual(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const parsed = residualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const target = await riskInWorkspace(d.riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  const levelError = await levelWithin(gate.user.workspaceId, d.likelihood, d.impact);
  if (levelError) return { error: levelError };

  const { db } = getDb();
  const now = new Date();
  await db
    .update(rskRisks)
    .set({ residualLikelihood: d.likelihood, residualImpact: d.impact, updatedAt: now })
    .where(eq(rskRisks.id, d.riskId));
  await db.insert(rskAssessments).values({
    id: crypto.randomUUID(),
    workspaceId: gate.user.workspaceId,
    riskId: d.riskId,
    kind: "residual",
    likelihood: d.likelihood,
    impact: d.impact,
    note: d.note,
    assessedByName: gate.user.name,
    createdAt: now,
  });
  const m = await getMethodology(gate.user.workspaceId);
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.assessed",
    entityType: "risk:risk",
    entityId: d.riskId,
    summary: `Residual assessment for ${target.ref}: ${d.likelihood}×${d.impact} (${bandFor(riskScore(d.likelihood, d.impact), m)}).`,
  });
  revalidateRisk(d.riskId);
  return { ok: true };
}

// ---- Treatment strategy + status ----------------------------------------------

const strategySchema = z.object({
  riskId: z.string().min(1),
  strategy: z.enum(STRATEGIES),
  notes: z.string().trim().max(2000).optional().default(""),
});

export async function setTreatmentStrategy(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const parsed = strategySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await riskInWorkspace(parsed.data.riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  const { db } = getDb();
  await db
    .update(rskRisks)
    .set({
      treatmentStrategy: parsed.data.strategy,
      treatmentNotes: parsed.data.notes,
      status: target.status === "accepted" ? target.status : "in_treatment",
      updatedAt: new Date(),
    })
    .where(eq(rskRisks.id, target.id));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.treatment_updated",
    entityType: "risk:risk",
    entityId: target.id,
    summary: `Treatment for ${target.ref}: ${parsed.data.strategy}.`,
  });
  await emitEvent({
    workspaceId: gate.user.workspaceId,
    type: "risk.treatment.updated",
    payload: { riskId: target.id, ref: target.ref, strategy: parsed.data.strategy },
    actorUserId: gate.user.id,
  });
  revalidateRisk(target.id);
  return { ok: true };
}

/** Acceptance is approval-gated: requires risk.risks.approve. */
export async function acceptRisk(riskId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_APPROVE);
  if ("error" in gate) return gate;
  const target = await riskInWorkspace(riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  if (target.status === "accepted") return { error: "Already accepted." };
  const { db } = getDb();
  const now = new Date();
  await db
    .update(rskRisks)
    .set({ status: "accepted", acceptedByName: gate.user.name, acceptedAt: now, updatedAt: now })
    .where(eq(rskRisks.id, riskId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.accepted",
    entityType: "risk:risk",
    entityId: riskId,
    summary: `Accepted risk ${target.ref} “${target.title}”.`,
  });
  await emitEvent({
    workspaceId: gate.user.workspaceId,
    type: "risk.accepted",
    payload: { riskId, ref: target.ref },
    actorUserId: gate.user.id,
  });
  revalidateRisk(riskId);
  return { ok: true };
}

export async function setRiskStatus(riskId: string, status: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  if (!RISK_STATUSES.includes(status as (typeof RISK_STATUSES)[number])) return { error: "Invalid status." };
  if (status === "accepted") return { error: "Use the Accept action (requires approval permission)." };
  const target = await riskInWorkspace(riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  const { db } = getDb();
  await db.update(rskRisks).set({ status, updatedAt: new Date() }).where(eq(rskRisks.id, riskId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.status_changed",
    entityType: "risk:risk",
    entityId: riskId,
    summary: `Moved ${target.ref} to ${status.replace("_", " ")}.`,
  });
  revalidateRisk(riskId);
  return { ok: true };
}

export async function deleteRisk(riskId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_DELETE);
  if ("error" in gate) return gate;
  const target = await riskInWorkspace(riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  const { db } = getDb();
  await db.delete(rskRisks).where(eq(rskRisks.id, riskId));
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.deleted",
    entityType: "risk:risk",
    entityId: riskId,
    summary: `Deleted risk ${target.ref} “${target.title}”.`,
  });
  revalidateRisk();
  return { ok: true };
}

// ---- Scope items & treatment actions (standalone fallbacks) ---------------------

const scopeSchema = z.object({
  riskId: z.string().min(1),
  name: z.string().trim().min(2, "Name is too short.").max(140),
  kind: z.enum(["service", "asset", "process", "other"]),
  notes: z.string().trim().max(500).optional().default(""),
});

export async function addScopeItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const parsed = scopeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await riskInWorkspace(parsed.data.riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  const { db } = getDb();
  await db.insert(rskScopeItems).values({
    id: crypto.randomUUID(),
    workspaceId: gate.user.workspaceId,
    riskId: target.id,
    name: parsed.data.name,
    kind: parsed.data.kind,
    notes: parsed.data.notes,
    createdAt: new Date(),
  });
  revalidateRisk(target.id);
  return { ok: true };
}

export async function removeScopeItem(itemId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const { db } = getDb();
  const rows = await db
    .select()
    .from(rskScopeItems)
    .where(and(eq(rskScopeItems.id, itemId), eq(rskScopeItems.workspaceId, gate.user.workspaceId)))
    .limit(1);
  if (!rows[0]) return { error: "Scope item not found." };
  await db.delete(rskScopeItems).where(eq(rskScopeItems.id, itemId));
  revalidateRisk(rows[0].riskId);
  return { ok: true };
}

const actionSchema = z.object({
  riskId: z.string().min(1),
  title: z.string().trim().min(2, "Title is too short.").max(180),
  dueDate: z.string().optional(),
});

export async function addTreatmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const parsed = actionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const target = await riskInWorkspace(parsed.data.riskId, gate.user.workspaceId);
  if (!target) return { error: "Risk not found." };
  const due =
    typeof parsed.data.dueDate === "string" && parsed.data.dueDate.trim()
      ? new Date(`${parsed.data.dueDate}T00:00:00.000Z`)
      : null;
  const { db } = getDb();
  await db.insert(rskTreatmentActions).values({
    id: crypto.randomUUID(),
    workspaceId: gate.user.workspaceId,
    riskId: target.id,
    title: parsed.data.title,
    dueDate: due && !Number.isNaN(due.getTime()) ? due : null,
    createdAt: new Date(),
  });
  revalidateRisk(target.id);
  return { ok: true };
}

export async function toggleTreatmentAction(itemId: string, done: boolean): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const { db } = getDb();
  const rows = await db
    .select()
    .from(rskTreatmentActions)
    .where(and(eq(rskTreatmentActions.id, itemId), eq(rskTreatmentActions.workspaceId, gate.user.workspaceId)))
    .limit(1);
  if (!rows[0]) return { error: "Action not found." };
  await db.update(rskTreatmentActions).set({ done }).where(eq(rskTreatmentActions.id, itemId));
  revalidateRisk(rows[0].riskId);
  return { ok: true };
}

export async function removeTreatmentAction(itemId: string): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_MANAGE);
  if ("error" in gate) return gate;
  const { db } = getDb();
  const rows = await db
    .select()
    .from(rskTreatmentActions)
    .where(and(eq(rskTreatmentActions.id, itemId), eq(rskTreatmentActions.workspaceId, gate.user.workspaceId)))
    .limit(1);
  if (!rows[0]) return { error: "Action not found." };
  await db.delete(rskTreatmentActions).where(eq(rskTreatmentActions.id, itemId));
  revalidateRisk(rows[0].riskId);
  return { ok: true };
}

// ---- Methodology -----------------------------------------------------------------

export async function updateMethodology(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const gate = await moduleGuardAction(MODULE, P_METHODOLOGY);
  if ("error" in gate) return gate;

  const likelihoodCount = Number(formData.get("likelihoodCount"));
  const impactCount = Number(formData.get("impactCount"));
  const read = (axis: string, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      label: String(formData.get(`${axis}Label${i}`) ?? "").trim(),
      description: String(formData.get(`${axis}Desc${i}`) ?? "").trim(),
    }));

  const candidate = {
    likelihood: read("likelihood", likelihoodCount),
    impact: read("impact", impactCount),
    bands: {
      low: Number(formData.get("bandLow")),
      medium: Number(formData.get("bandMedium")),
      high: Number(formData.get("bandHigh")),
    },
  };
  const parsed = methodologySchema.safeParse(candidate);
  if (!parsed.success) return { error: firstError(parsed.error) };
  const invalid = validateMethodology(parsed.data);
  if (invalid) return { error: invalid };
  const conflict = shrinkConflict(parsed.data, await highestLevelsInUse(gate.user.workspaceId));
  if (conflict) return { error: conflict };

  await saveMethodology(gate.user.workspaceId, parsed.data);
  await logAudit({
    workspaceId: gate.user.workspaceId,
    actor: { id: gate.user.id, name: gate.user.name, email: gate.user.email },
    action: "risk.methodology_updated",
    entityType: "settings",
    entityId: "risk.methodology",
    summary: `Updated the risk methodology (${parsed.data.likelihood.length}×${parsed.data.impact.length} matrix).`,
  });
  for (const p of ["/m/risk", "/m/risk/register", "/m/risk/heatmap", "/m/risk/methodology"]) revalidatePath(p);
  return { ok: true };
}
