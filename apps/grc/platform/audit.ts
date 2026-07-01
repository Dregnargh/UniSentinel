import { and, desc, eq, sql } from "drizzle-orm";
import { auditLog, type AuditLogEntry } from "@unisentinel/db";
import { getDb } from "./db";

// Every mutation in the platform and in every module calls logAudit() after
// its write. The table is append-only (DB trigger); actor identity is
// snapshotted so history survives user deletion.

export interface AuditActor {
  id: string | null;
  name: string;
  email: string;
}

export const SYSTEM_ACTOR: AuditActor = { id: null, name: "System", email: "system@unisentinel" };

export async function logAudit(entry: {
  workspaceId: string;
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  diff?: { before?: unknown; after?: unknown };
}): Promise<void> {
  const { db } = getDb();
  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    workspaceId: entry.workspaceId,
    actorUserId: entry.actor.id,
    actorName: entry.actor.name,
    actorEmail: entry.actor.email,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    summary: entry.summary,
    diff: entry.diff ?? null,
    createdAt: new Date(),
  });
}

export const AUDIT_PAGE_SIZE = 25;

export async function listAuditLog(
  workspaceId: string,
  opts: { page?: number; entityType?: string } = {},
): Promise<{ entries: AuditLogEntry[]; total: number; page: number; pageCount: number }> {
  const { db } = getDb();
  const page = Math.max(1, opts.page ?? 1);
  const where = opts.entityType
    ? and(eq(auditLog.workspaceId, workspaceId), eq(auditLog.entityType, opts.entityType))
    : eq(auditLog.workspaceId, workspaceId);

  const [entries, counts] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(AUDIT_PAGE_SIZE)
      .offset((page - 1) * AUDIT_PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(auditLog).where(where),
  ]);
  const total = counts[0]?.count ?? 0;
  return { entries, total, page, pageCount: Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE)) };
}

/** Distinct entity types present in the log — feeds the filter dropdown. */
export async function listAuditEntityTypes(workspaceId: string): Promise<string[]> {
  const { db } = getDb();
  const rows = await db
    .selectDistinct({ entityType: auditLog.entityType })
    .from(auditLog)
    .where(eq(auditLog.workspaceId, workspaceId))
    .orderBy(auditLog.entityType);
  return rows.map((r) => r.entityType);
}
