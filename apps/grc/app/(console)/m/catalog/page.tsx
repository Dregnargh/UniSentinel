import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { catalogStats } from "@/modules/catalog/queries";
import { CatalogOverviewClient } from "./CatalogOverviewClient";

export const metadata: Metadata = { title: "Service Catalog" };
export const dynamic = "force-dynamic";

export default async function CatalogOverviewPage() {
  const ctx = await requireModule("catalog", "catalog.assets.view");
  const stats = await catalogStats(ctx.user.workspaceId);
  return <CatalogOverviewClient stats={stats} />;
}
