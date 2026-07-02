import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { listAssets, listDataFlows, listRelationships, listServices } from "@/modules/catalog/queries";
import { MapClient } from "./MapClient";

export const metadata: Metadata = { title: "Map" };
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const ctx = await requireModule("catalog", "catalog.assets.view");
  const [services, assets, relationships, flows] = await Promise.all([
    listServices(ctx.user.workspaceId),
    listAssets(ctx.user.workspaceId),
    listRelationships(ctx.user.workspaceId),
    listDataFlows(ctx.user.workspaceId),
  ]);
  return (
    <MapClient
      services={services.map((s) => ({ id: s.id, name: s.name, criticality: s.criticality }))}
      assets={assets.map((a) => ({ id: a.id, name: a.name, type: a.type, classification: a.classification }))}
      relationships={relationships.map((r) => ({
        id: r.id,
        source: `${r.sourceKind}:${r.sourceId}`,
        target: `${r.targetKind}:${r.targetId}`,
        kind: r.kind,
      }))}
      flows={flows.map((f) => ({
        id: f.id,
        source: `${f.sourceKind}:${f.sourceId}`,
        target: `${f.targetKind}:${f.targetId}`,
        classification: f.dataClassification,
        protocol: f.protocol,
      }))}
    />
  );
}
