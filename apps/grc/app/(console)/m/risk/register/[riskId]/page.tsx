import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { isModuleEnabled } from "@/platform/modules/entitlements";
import { getMethodology } from "@/modules/risk/methodology-store";
import { getRisk, listAssessments, listScopeItems, listTreatmentActions } from "@/modules/risk/queries";
import { getCatalogScope, getLinkedTasks } from "@/modules/risk/integrations";
import { searchCatalogEntities } from "@/modules/catalog/queries";
import { RiskDetailClient } from "./RiskDetailClient";

export const metadata: Metadata = { title: "Risk" };
export const dynamic = "force-dynamic";

export default async function RiskDetailPage(props: { params: Promise<{ riskId: string }> }) {
  const { riskId } = await props.params;
  const ctx = await requireModule("risk", "risk.risks.view");
  const risk = await getRisk(riskId, ctx.user.workspaceId);
  if (!risk) notFound();
  const [methodology, scope, actions, assessments, catalogLicensed, tasksLicensed] = await Promise.all([
    getMethodology(ctx.user.workspaceId),
    listScopeItems(riskId, ctx.user.workspaceId),
    listTreatmentActions(riskId, ctx.user.workspaceId),
    listAssessments(riskId, ctx.user.workspaceId),
    isModuleEnabled(ctx.user.workspaceId, "catalog"),
    isModuleEnabled(ctx.user.workspaceId, "tasks"),
  ]);
  const [catalogScope, catalogCandidates, linkedTasks] = await Promise.all([
    catalogLicensed ? getCatalogScope(ctx.user.workspaceId, riskId) : [],
    catalogLicensed ? searchCatalogEntities(ctx.user.workspaceId, "", 100) : [],
    tasksLicensed ? getLinkedTasks(ctx.user.workspaceId, riskId) : [],
  ]);
  return (
    <RiskDetailClient
      risk={risk}
      methodology={methodology}
      // Promoted local rows are superseded by their catalog link / task.
      scope={scope
        .filter((s) => !s.promotedTo)
        .map((s) => ({ id: s.id, name: s.name, kind: s.kind, notes: s.notes }))}
      actions={actions
        .filter((a) => !a.promotedTo)
        .map((a) => ({
          id: a.id,
          title: a.title,
          done: a.done,
          dueDate: a.dueDate?.toISOString().slice(0, 10) ?? null,
        }))}
      assessments={assessments.map((a) => ({
        id: a.id,
        kind: a.kind,
        likelihood: a.likelihood,
        impact: a.impact,
        note: a.note,
        by: a.assessedByName,
        at: a.createdAt.toISOString(),
      }))}
      integrations={{
        catalogLicensed,
        tasksLicensed,
        catalogScope,
        catalogCandidates: catalogCandidates.map((c) => ({ type: c.type, id: c.id, name: c.name, detail: c.detail })),
        linkedTasks,
      }}
      can={{
        manage: permitted(ctx.permissions, "risk.risks.manage"),
        approve: permitted(ctx.permissions, "risk.risks.approve"),
      }}
    />
  );
}
