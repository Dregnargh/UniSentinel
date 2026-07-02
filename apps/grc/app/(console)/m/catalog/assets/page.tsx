import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { listAssets } from "@/modules/catalog/queries";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { AssetsClient } from "./AssetsClient";

export const metadata: Metadata = { title: "Assets" };
export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const ctx = await requireModule("catalog", "catalog.assets.view");
  const [assets, members] = await Promise.all([
    listAssets(ctx.user.workspaceId),
    listWorkspaceUsers(ctx.user.workspaceId),
  ]);
  return (
    <AssetsClient
      assets={assets.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        description: a.description,
        location: a.location,
        classification: a.classification,
        status: a.status,
        ownerName: a.ownerName,
        attributes: a.attributes,
      }))}
      owners={members.filter((m) => m.active).map((m) => ({ id: m.id, name: m.name }))}
      canManage={permitted(ctx.permissions, "catalog.assets.manage")}
      canImport={permitted(ctx.permissions, "catalog.assets.import")}
    />
  );
}
