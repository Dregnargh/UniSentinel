import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { getMethodology } from "@/modules/risk/methodology-store";
import { highestLevelsInUse } from "@/modules/risk/queries";
import { MethodologyClient } from "./MethodologyClient";

export const metadata: Metadata = { title: "Methodology" };
export const dynamic = "force-dynamic";

export default async function MethodologyPage() {
  const ctx = await requireModule("risk", "risk.risks.view");
  const [methodology, inUse] = await Promise.all([
    getMethodology(ctx.user.workspaceId),
    highestLevelsInUse(ctx.user.workspaceId),
  ]);
  return (
    <MethodologyClient
      methodology={methodology}
      inUse={inUse}
      canManage={permitted(ctx.permissions, "risk.methodology.manage")}
    />
  );
}
