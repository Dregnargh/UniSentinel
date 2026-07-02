import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { roles, userRoles } from "@unisentinel/db";
import { requireSession } from "@/platform/auth/session";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { P, permitted } from "@/platform/rbac/catalog";
import { getInbox } from "@/platform/notify/queries";
import { getDb } from "@/platform/db";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  if (user.mustChangePassword) redirect("/change-password");

  const { db } = getDb();
  const [permissions, inbox, roleRows] = await Promise.all([
    getPermissionSet(user.id),
    getInbox(user.id),
    db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id)),
  ]);

  return (
    <AppShell
      user={{ name: user.name, email: user.email, roleNames: roleRows.map((r) => r.name) }}
      nav={{
        users: permitted(permissions, P.usersView),
        roles: permitted(permissions, P.rolesView),
        org: permitted(permissions, P.orgView),
        audit: permitted(permissions, P.auditView),
        settings: permitted(permissions, P.settingsManage),
      }}
      inbox={inbox}
    >
      {children}
    </AppShell>
  );
}
