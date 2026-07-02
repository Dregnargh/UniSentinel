import type { Metadata } from "next";
import { requirePermission } from "@/platform/rbac/guard";
import { P, permitted } from "@/platform/rbac/catalog";
import { listWorkspaceUsers } from "@/platform/users/queries";
import { listRoles, rolesByUser } from "@/platform/roles/queries";
import { UsersClient } from "./UsersClient";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const ctx = await requirePermission(P.usersView);
  const [members, userRoleMap, roles] = await Promise.all([
    listWorkspaceUsers(ctx.user.workspaceId),
    rolesByUser(ctx.user.workspaceId),
    listRoles(ctx.user.workspaceId),
  ]);
  return (
    <UsersClient
      meId={ctx.user.id}
      can={{
        create: permitted(ctx.permissions, P.usersCreate),
        edit: permitted(ctx.permissions, P.usersEdit),
        resetPassword: permitted(ctx.permissions, P.usersResetPassword),
        del: permitted(ctx.permissions, P.usersDelete),
      }}
      allRoles={roles.map((r) => ({ id: r.id, name: r.name, isSystem: r.isSystem }))}
      members={members.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        roles: userRoleMap.get(m.id) ?? [],
      }))}
    />
  );
}
