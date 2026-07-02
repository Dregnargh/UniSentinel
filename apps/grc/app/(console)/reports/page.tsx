import type { Metadata } from "next";
import { requireSession } from "@/platform/auth/session";
import { getPermissionSet } from "@/platform/rbac/permissions";
import { availableReports } from "@/platform/reports/service";
import { ReportsClient } from "./ReportsClient";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { user } = await requireSession();
  const permissions = await getPermissionSet(user.id);
  const reports = await availableReports(user.workspaceId, permissions);
  return (
    <ReportsClient
      reports={reports.map((r) => ({
        key: r.key,
        title: r.title,
        description: r.description,
        moduleName: r.moduleName,
      }))}
    />
  );
}
