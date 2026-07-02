// Risk report data (server-only). Dispatched by platform/reports/service.ts
// AFTER license/permission checks; params arrive validated against the
// manifest's option lists.
import type { ReportSection } from "@/platform/reports/pdf";
import { BAND_LABEL, bandFor, riskScore, type RiskBand } from "./methodology";
import { getMethodology } from "./methodology-store";
import { listRisks } from "./queries";

const OPEN_STATUSES = new Set(["draft", "assessed", "in_treatment"]);

export async function riskReportData(
  reportKey: string,
  params: Record<string, string>,
  workspaceId: string,
): Promise<ReportSection[] | null> {
  if (reportKey !== "risk.register") return null;
  const [risks, methodology] = await Promise.all([listRisks(workspaceId), getMethodology(workspaceId)]);

  const scored = risks.map((r) => {
    const inherent = riskScore(r.inherentLikelihood, r.inherentImpact);
    const residual = r.residualLikelihood && r.residualImpact ? riskScore(r.residualLikelihood, r.residualImpact) : null;
    return { ...r, inherent, band: bandFor(inherent, methodology), residual };
  });
  const filtered = scored.filter((r) => {
    if (params.status === "open" && !OPEN_STATUSES.has(r.status)) return false;
    if (params.status === "accepted" && r.status !== "accepted") return false;
    if (params.status === "closed" && r.status !== "closed") return false;
    if (params.band !== "all" && r.band !== params.band) return false;
    return true;
  });

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of filtered) counts[r.band]++;

  return [
    {
      stats: [
        { label: "Risks", value: String(filtered.length) },
        ...(["critical", "high", "medium", "low"] as RiskBand[]).map((band) => ({
          label: BAND_LABEL[band],
          value: String(counts[band]),
        })),
      ],
    },
    {
      table: {
        columns: ["Ref", "Risk", "Status", "Inherent", "Band", "Residual", "Owner"],
        rows: filtered.map((r) => [
          r.ref,
          r.title,
          r.status.replace("_", " "),
          `${r.inherentLikelihood}×${r.inherentImpact} = ${r.inherent}`,
          BAND_LABEL[r.band],
          r.residual === null ? "—" : `${r.residualLikelihood}×${r.residualImpact} = ${r.residual}`,
          r.ownerName ?? "—",
        ]),
      },
    },
  ];
}
