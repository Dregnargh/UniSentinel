// Report generation service (server-only): the platform-side dispatcher into
// each module's report-data provider (mirrors platform/dashboards/data.ts for
// widgets). Callers are responsible for auth; this enforces license +
// permission again and audits every generation.
import { eq } from "drizzle-orm";
import { workspaces } from "@unisentinel/db";
import { getDb } from "@/platform/db";
import { allReports, type RegisteredReport } from "@/modules/registry";
import { catalogReportData } from "@/modules/catalog/reports";
import { tasksReportData } from "@/modules/tasks/reports";
import { riskReportData } from "@/modules/risk/reports";
import { getEntitlements } from "@/platform/modules/entitlements";
import { permitted } from "@/platform/rbac/catalog";
import { getBranding } from "@/platform/branding";
import { getStorage } from "@/platform/storage";
import { logAudit } from "@/platform/audit";
import { renderReportPdf, type ReportSection } from "./pdf";

/** Reports the viewer may run: module licensed AND permission held. */
export async function availableReports(
  workspaceId: string,
  permissions: Set<string>,
): Promise<RegisteredReport[]> {
  const entitlements = await getEntitlements(workspaceId);
  return allReports().filter(
    (r) => entitlements.get(r.moduleKey)?.status === "active" && permitted(permissions, r.permission),
  );
}

/** Clamp requested params to the manifest's option lists (first = default). */
export function extractParams(def: RegisteredReport, source: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  for (const p of def.params) {
    const requested = source.get(p.name);
    params[p.name] = p.options.some((o) => o.value === requested) ? requested! : p.options[0].value;
  }
  return params;
}

function reportData(
  def: RegisteredReport,
  params: Record<string, string>,
  workspaceId: string,
): Promise<ReportSection[] | null> {
  switch (def.moduleKey) {
    case "risk":
      return riskReportData(def.key, params, workspaceId);
    case "tasks":
      return tasksReportData(def.key, params, workspaceId);
    case "catalog":
      return catalogReportData(def.key, params, workspaceId);
    default:
      return Promise.resolve(null);
  }
}

export async function generateReportPdf(input: {
  def: RegisteredReport;
  params: Record<string, string>;
  workspaceId: string;
  actor: { id: string; name: string; email: string };
}): Promise<Buffer | null> {
  const { def, params, workspaceId, actor } = input;
  const sections = await reportData(def, params, workspaceId);
  if (!sections) return null;

  const { db } = getDb();
  const [workspaceRows, branding] = await Promise.all([
    db.select({ name: workspaces.name }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1),
    getBranding(workspaceId),
  ]);
  const logo = branding ? await getStorage().get(branding.logoKey) : null;

  const paramsLine = def.params
    .map((p) => `${p.label}: ${p.options.find((o) => o.value === params[p.name])?.label ?? params[p.name]}`)
    .join("  ·  ");

  const pdf = await renderReportPdf({
    title: def.title,
    workspaceName: workspaceRows[0]?.name ?? "Workspace",
    generatedBy: actor.name,
    generatedAt: new Date(),
    paramsLine,
    logo,
    sections,
  });

  await logAudit({
    workspaceId,
    actor,
    action: "report.generated",
    entityType: "report",
    entityId: def.key,
    summary: `Generated the “${def.title}” report (${paramsLine.replaceAll("  ·  ", ", ")}).`,
  });
  return pdf;
}
