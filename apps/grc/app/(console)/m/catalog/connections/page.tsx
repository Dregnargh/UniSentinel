import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { listAssets, listDataFlows, listRelationships, listServices } from "@/modules/catalog/queries";
import { ConnectionsClient } from "./ConnectionsClient";

export const metadata: Metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const ctx = await requireModule("catalog", "catalog.assets.view");
  const [services, assets, relationships, flows] = await Promise.all([
    listServices(ctx.user.workspaceId),
    listAssets(ctx.user.workspaceId),
    listRelationships(ctx.user.workspaceId),
    listDataFlows(ctx.user.workspaceId),
  ]);

  const names = new Map<string, string>();
  for (const s of services) names.set(`service:${s.id}`, s.name);
  for (const a of assets) names.set(`asset:${a.id}`, a.name);
  const nameOf = (kind: string, id: string) => names.get(`${kind}:${id}`) ?? "(deleted)";

  return (
    <ConnectionsClient
      endpoints={[
        ...services.map((s) => ({ ref: `service:${s.id}`, label: `${s.name} (service)` })),
        ...assets.map((a) => ({ ref: `asset:${a.id}`, label: `${a.name} (${a.type})` })),
      ]}
      relationships={relationships.map((r) => ({
        id: r.id,
        source: nameOf(r.sourceKind, r.sourceId),
        target: nameOf(r.targetKind, r.targetId),
        kind: r.kind,
      }))}
      flows={flows.map((f) => ({
        id: f.id,
        source: nameOf(f.sourceKind, f.sourceId),
        target: nameOf(f.targetKind, f.targetId),
        name: f.name,
        classification: f.dataClassification,
        protocol: f.protocol,
      }))}
      canManage={permitted(ctx.permissions, "catalog.assets.manage")}
    />
  );
}
