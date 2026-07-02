// Risk widget data (server-only). Dispatched by platform/dashboards/data.ts
// AFTER the module-license and viewer-permission checks have passed.
import type { WidgetData } from "@/modules/types";
import { BAND_LABEL, bandFor, bandTone, riskScore } from "./methodology";
import { getMethodology } from "./methodology-store";
import { listRisks } from "./queries";

export async function riskWidgetData(widgetKey: string, workspaceId: string): Promise<WidgetData | null> {
  const [risks, methodology] = await Promise.all([listRisks(workspaceId), getMethodology(workspaceId)]);
  const open = risks.filter((r) => r.status !== "closed");

  if (widgetKey === "risk.bands") {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const r of open) counts[bandFor(riskScore(r.inherentLikelihood, r.inherentImpact), methodology)]++;
    return {
      kind: "stats",
      stats: (["critical", "high", "medium", "low"] as const).map((band) => ({
        label: BAND_LABEL[band],
        value: String(counts[band]),
        tone: bandTone[band],
      })),
    };
  }

  if (widgetKey === "risk.top") {
    const top = open
      .map((r) => {
        const score = riskScore(r.inherentLikelihood, r.inherentImpact);
        return { ...r, score, band: bandFor(score, methodology) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return {
      kind: "table",
      columns: ["Ref", "Risk", "Score", "Band", "Status"],
      rows: top.map((r) => ({
        cells: [r.ref, r.title, String(r.score), BAND_LABEL[r.band], r.status.replace("_", " ")],
        href: `/m/risk/register/${r.id}`,
      })),
      empty: "No open risks.",
    };
  }

  if (widgetKey === "risk.heatmap") {
    const L = methodology.likelihood.length;
    const I = methodology.impact.length;
    const cells = Array.from({ length: L }, (_, li) =>
      Array.from({ length: I }, (_, ii) => ({
        count: 0,
        band: bandFor(riskScore(li + 1, ii + 1), methodology) as string,
      })),
    );
    for (const r of open) {
      const cell = cells[r.inherentLikelihood - 1]?.[r.inherentImpact - 1];
      if (cell) cell.count++;
    }
    return { kind: "heatmap", cells };
  }

  return null;
}
