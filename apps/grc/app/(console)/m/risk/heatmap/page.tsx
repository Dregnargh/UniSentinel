import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { getMethodology } from "@/modules/risk/methodology-store";
import { listRisks } from "@/modules/risk/queries";
import { HeatmapClient } from "./HeatmapClient";

export const metadata: Metadata = { title: "Heatmap" };
export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const ctx = await requireModule("risk", "risk.risks.view");
  const [risks, methodology] = await Promise.all([
    listRisks(ctx.user.workspaceId),
    getMethodology(ctx.user.workspaceId),
  ]);
  return <HeatmapClient risks={risks} methodology={methodology} />;
}
