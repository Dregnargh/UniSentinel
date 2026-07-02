import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { getMethodology } from "@/modules/risk/methodology-store";
import { listRisks } from "@/modules/risk/queries";
import { promotionStatus } from "@/modules/risk/integrations";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { listOrgUnits } from "@/platform/org/queries";
import { RegisterClient } from "./RegisterClient";

export const metadata: Metadata = { title: "Risk register" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const ctx = await requireModule("risk", "risk.risks.view");
  const canManage = permitted(ctx.permissions, "risk.risks.manage");
  const [risks, methodology, members, units, promo] = await Promise.all([
    listRisks(ctx.user.workspaceId),
    getMethodology(ctx.user.workspaceId),
    listWorkspaceUsers(ctx.user.workspaceId),
    listOrgUnits(ctx.user.workspaceId),
    canManage ? promotionStatus(ctx.user.workspaceId) : null,
  ]);
  return (
    <RegisterClient
      risks={risks}
      methodology={methodology}
      owners={members.filter((m) => m.active).map((m) => ({ id: m.id, name: m.name }))}
      orgUnits={units.map((u) => ({ id: u.id, name: u.name }))}
      canManage={canManage}
      canDelete={permitted(ctx.permissions, "risk.risks.delete")}
      promotable={{ scope: promo?.scope ?? 0, treatments: promo?.treatments ?? 0 }}
    />
  );
}
