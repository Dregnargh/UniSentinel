import type { Metadata } from "next";
import Link from "next/link";
import { requireModule } from "@/platform/modules/guard";
import { getMethodology } from "@/modules/risk/methodology-store";
import { listRisks } from "@/modules/risk/queries";
import { RiskOverviewClient } from "./RiskOverviewClient";

export const metadata: Metadata = { title: "Risk Management" };
export const dynamic = "force-dynamic";

export default async function RiskOverviewPage() {
  const ctx = await requireModule("risk", "risk.risks.view");
  const [risks, methodology] = await Promise.all([
    listRisks(ctx.user.workspaceId),
    getMethodology(ctx.user.workspaceId),
  ]);
  if (risks.length === 0) {
    return (
      <div className="stack">
        <div className="page-head">
          <div>
            <h1>Risk Management</h1>
            <p>No risks yet — start the register.</p>
          </div>
        </div>
        <p className="muted">
          Create your first risk in the <Link href="/m/risk/register">register</Link>, or adjust the{" "}
          <Link href="/m/risk/methodology">methodology</Link> (matrix size, labels, bands) first.
        </p>
      </div>
    );
  }
  return <RiskOverviewClient risks={risks} methodology={methodology} />;
}
