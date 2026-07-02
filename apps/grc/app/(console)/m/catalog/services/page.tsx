import type { Metadata } from "next";
import { requireModule } from "@/platform/modules/guard";
import { permitted } from "@/platform/rbac/catalog";
import { listServices } from "@/modules/catalog/queries";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { listOrgUnits } from "@/platform/org/queries";
import { ServicesClient } from "./ServicesClient";

export const metadata: Metadata = { title: "Services" };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const ctx = await requireModule("catalog", "catalog.services.view");
  const [services, members, units] = await Promise.all([
    listServices(ctx.user.workspaceId),
    listWorkspaceUsers(ctx.user.workspaceId),
    listOrgUnits(ctx.user.workspaceId),
  ]);
  return (
    <ServicesClient
      services={services}
      owners={members.filter((m) => m.active).map((m) => ({ id: m.id, name: m.name }))}
      orgUnits={units.map((u) => ({ id: u.id, name: u.name }))}
      canManage={permitted(ctx.permissions, "catalog.services.manage")}
    />
  );
}
