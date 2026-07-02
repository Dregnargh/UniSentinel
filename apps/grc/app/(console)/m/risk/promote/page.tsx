import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import {
  listPromotableScope,
  listPromotableTreatments,
  promotionStatus,
} from "@/modules/risk/integrations";
import { searchCatalogEntities } from "@/modules/catalog/queries";
import { PromoteClient } from "./PromoteClient";

export const metadata: Metadata = { title: "Promote risk data" };
export const dynamic = "force-dynamic";

export default async function PromotePage() {
  const ctx = await requireModule("risk", "risk.risks.manage");
  const status = await promotionStatus(ctx.user.workspaceId);
  const [scopeItems, treatments, candidates] = await Promise.all([
    status.catalogLicensed ? listPromotableScope(ctx.user.workspaceId) : [],
    status.tasksLicensed ? listPromotableTreatments(ctx.user.workspaceId) : [],
    status.catalogLicensed ? searchCatalogEntities(ctx.user.workspaceId, "", 100) : [],
  ]);
  return (
    <PromoteClient
      catalogLicensed={status.catalogLicensed}
      tasksLicensed={status.tasksLicensed}
      scopeItems={scopeItems}
      treatments={treatments}
      candidates={candidates.map((c) => ({ type: c.type, id: c.id, name: c.name, detail: c.detail }))}
    />
  );
}
