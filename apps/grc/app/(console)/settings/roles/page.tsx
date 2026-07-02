import type { Metadata } from "next";
import { requirePermission } from "@/platform/rbac/guard";
import { P, PERMISSION_CATALOG, permitted } from "@/platform/rbac/catalog";
import { listRoles } from "@/platform/roles/queries";
import { RolesClient } from "./RolesClient";

export const metadata: Metadata = { title: "Roles" };
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const ctx = await requirePermission(P.rolesView);
  const roles = await listRoles(ctx.user.workspaceId);
  return (
    <RolesClient
      roles={roles}
      catalog={PERMISSION_CATALOG}
      canManage={permitted(ctx.permissions, P.rolesManage)}
    />
  );
}
