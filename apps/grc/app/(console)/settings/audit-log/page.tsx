import type { Metadata } from "next";
import { requireAdmin } from "@/platform/auth/session";
import { listAuditEntityTypes, listAuditLog } from "@/platform/audit";
import { AuditLogClient } from "./AuditLogClient";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

export default async function AuditLogPage(props: {
  searchParams: Promise<{ page?: string; entityType?: string }>;
}) {
  const { user } = await requireAdmin();
  const sp = await props.searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const entityType = sp.entityType || undefined;

  const [{ entries, total, pageCount }, entityTypes] = await Promise.all([
    listAuditLog(user.workspaceId, { page, entityType }),
    listAuditEntityTypes(user.workspaceId),
  ]);

  return (
    <AuditLogClient
      entries={entries.map((e) => ({
        id: e.id,
        actorName: e.actorName,
        action: e.action,
        summary: e.summary,
        at: e.createdAt.toISOString(),
      }))}
      total={total}
      page={page}
      pageCount={pageCount}
      entityType={entityType}
      entityTypes={entityTypes}
    />
  );
}
