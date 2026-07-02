import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { roles, userRoles } from "@unisentinel/db";
import { requireSession } from "@/platform/auth/session";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { P, permitted } from "@/platform/rbac/catalog";
import { getInbox } from "@/platform/notify/queries";
import { getDb } from "@/platform/db";
import { getEntitlements } from "@/platform/modules/entitlements";
import { getBranding } from "@/platform/branding";
import { MODULES, allReports } from "@/modules/registry";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession();
  if (user.mustChangePassword) redirect("/change-password");

  const { db } = getDb();
  const [permissions, inbox, roleRows, entitlements, branding] = await Promise.all([
    getPermissionSet(user.id),
    getInbox(user.id),
    db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id)),
    getEntitlements(user.workspaceId),
    getBranding(user.workspaceId),
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
        reports: allReports().some(
          (r) => entitlements.get(r.moduleKey)?.status === "active" && permitted(permissions, r.permission),
        ),
      }}
      inbox={inbox}
      modules={MODULES.map((m) => {
        const e = entitlements.get(m.key);
        return {
          key: m.key,
          name: m.name,
          description: m.description,
          icon: m.icon,
          licensed: e?.status === "active",
          expired: e?.status === "expired",
        };
      })}
      moduleNavs={MODULES.filter((m) => entitlements.get(m.key)?.status === "active").map((m) => ({
        key: m.key,
        name: m.name,
        items: (m.navigation ?? [{ path: "", label: "Overview" }]).map((n) => ({
          href: `/m/${m.key}${n.path}`,
          label: n.label,
        })),
      }))}
      hasLogo={branding !== null}
    >
      {children}
    </AppShell>
  );
}
