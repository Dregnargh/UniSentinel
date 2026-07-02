import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  orgUnits,
  rskAssessments,
  rskRisks,
  rskScopeItems,
  rskTreatmentActions,
  users,
} from "@unisentinel/db";
import { getDb } from "@/platform/db";

export interface RiskRow {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: string;
  status: string;
  ownerUserId: string | null;
  ownerName: string | null;
  orgUnitId: string | null;
  orgUnitName: string | null;
  inherentLikelihood: number;
  inherentImpact: number;
  residualLikelihood: number | null;
  residualImpact: number | null;
  treatmentStrategy: string | null;
  treatmentNotes: string;
  acceptedByName: string | null;
  acceptedAt: string | null;
}

const selection = {
  id: rskRisks.id,
  ref: rskRisks.ref,
  title: rskRisks.title,
  description: rskRisks.description,
  category: rskRisks.category,
  status: rskRisks.status,
  ownerUserId: rskRisks.ownerUserId,
  ownerName: users.name,
  orgUnitId: rskRisks.orgUnitId,
  orgUnitName: orgUnits.name,
  inherentLikelihood: rskRisks.inherentLikelihood,
  inherentImpact: rskRisks.inherentImpact,
  residualLikelihood: rskRisks.residualLikelihood,
  residualImpact: rskRisks.residualImpact,
  treatmentStrategy: rskRisks.treatmentStrategy,
  treatmentNotes: rskRisks.treatmentNotes,
  acceptedByName: rskRisks.acceptedByName,
  acceptedAt: rskRisks.acceptedAt,
};

function toRow(r: (typeof selection extends infer T ? { [K in keyof T]: unknown } : never) & {
  acceptedAt: Date | null;
}): RiskRow {
  return { ...(r as Omit<RiskRow, "acceptedAt">), acceptedAt: r.acceptedAt ? r.acceptedAt.toISOString() : null };
}

export async function listRisks(workspaceId: string): Promise<RiskRow[]> {
  const { db } = getDb();
  const rows = await db
    .select(selection)
    .from(rskRisks)
    .leftJoin(users, eq(rskRisks.ownerUserId, users.id))
    .leftJoin(orgUnits, eq(rskRisks.orgUnitId, orgUnits.id))
    .where(eq(rskRisks.workspaceId, workspaceId))
    .orderBy(asc(rskRisks.ref));
  return rows.map((r) => toRow(r as Parameters<typeof toRow>[0]));
}

export async function getRisk(riskId: string, workspaceId: string): Promise<RiskRow | null> {
  const { db } = getDb();
  const rows = await db
    .select(selection)
    .from(rskRisks)
    .leftJoin(users, eq(rskRisks.ownerUserId, users.id))
    .leftJoin(orgUnits, eq(rskRisks.orgUnitId, orgUnits.id))
    .where(and(eq(rskRisks.id, riskId), eq(rskRisks.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ? toRow(rows[0] as Parameters<typeof toRow>[0]) : null;
}

export async function riskInWorkspace(riskId: string, workspaceId: string) {
  const { db } = getDb();
  const rows = await db
    .select()
    .from(rskRisks)
    .where(and(eq(rskRisks.id, riskId), eq(rskRisks.workspaceId, workspaceId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function nextRef(workspaceId: string): Promise<string> {
  const { db } = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rskRisks)
    .where(eq(rskRisks.workspaceId, workspaceId));
  return `RSK-${(rows[0]?.count ?? 0) + 1}`;
}

/** Highest levels referenced by any risk — the methodology shrink guard. */
export async function highestLevelsInUse(workspaceId: string): Promise<{ likelihood: number; impact: number }> {
  const { db } = getDb();
  const rows = await db
    .select({
      likelihood: sql<number>`COALESCE(MAX(GREATEST(${rskRisks.inherentLikelihood}, COALESCE(${rskRisks.residualLikelihood}, 0))), 0)::int`,
      impact: sql<number>`COALESCE(MAX(GREATEST(${rskRisks.inherentImpact}, COALESCE(${rskRisks.residualImpact}, 0))), 0)::int`,
    })
    .from(rskRisks)
    .where(eq(rskRisks.workspaceId, workspaceId));
  return rows[0] ?? { likelihood: 0, impact: 0 };
}

export async function listScopeItems(riskId: string, workspaceId: string) {
  const { db } = getDb();
  return db
    .select()
    .from(rskScopeItems)
    .where(and(eq(rskScopeItems.riskId, riskId), eq(rskScopeItems.workspaceId, workspaceId)))
    .orderBy(asc(rskScopeItems.createdAt));
}

export async function listTreatmentActions(riskId: string, workspaceId: string) {
  const { db } = getDb();
  return db
    .select()
    .from(rskTreatmentActions)
    .where(and(eq(rskTreatmentActions.riskId, riskId), eq(rskTreatmentActions.workspaceId, workspaceId)))
    .orderBy(asc(rskTreatmentActions.createdAt));
}

export async function listAssessments(riskId: string, workspaceId: string) {
  const { db } = getDb();
  return db
    .select()
    .from(rskAssessments)
    .where(and(eq(rskAssessments.riskId, riskId), eq(rskAssessments.workspaceId, workspaceId)))
    .orderBy(desc(rskAssessments.createdAt));
}
