import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/platform/auth/session";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { permitted } from "@/platform/rbac/catalog";
import { getEntitlements } from "@/platform/modules/entitlements";
import { findReport } from "@/modules/registry";
import { ReportClient } from "./ReportClient";

export const metadata: Metadata = { title: "Report" };
export const dynamic = "force-dynamic";

export default async function ReportPage(props: { params: Promise<{ reportKey: string }> }) {
  const { reportKey } = await props.params;
  const { user } = await requireSession();
  const def = findReport(reportKey);
  if (!def) notFound();
  const [permissions, entitlements] = await Promise.all([
    getPermissionSet(user.id),
    getEntitlements(user.workspaceId),
  ]);
  if (entitlements.get(def.moduleKey)?.status !== "active" || !permitted(permissions, def.permission)) {
    redirect("/reports");
  }
  return (
    <ReportClient
      report={{
        key: def.key,
        title: def.title,
        description: def.description,
        moduleName: def.moduleName,
        params: def.params,
      }}
    />
  );
}
