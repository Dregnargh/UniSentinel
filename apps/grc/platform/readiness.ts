import { sql } from "drizzle-orm";
import { instanceMeta } from "@unisentinel/db";
import { getDb } from "./db";

export interface Readiness {
  ready: boolean;
  reason?: string;
  migrations: number;
  workerHeartbeat: string | null;
}

/**
 * Answers "can this instance serve requests?": database reachable and at least
 * one migration applied (drizzle records them in drizzle.__drizzle_migrations).
 * Worker heartbeat is informational — the web tier is ready without it.
 */
export async function getReadiness(): Promise<Readiness> {
  if (!process.env.DATABASE_URL) {
    return { ready: false, reason: "DATABASE_URL is not configured.", migrations: 0, workerHeartbeat: null };
  }
  try {
    const { db } = getDb();
    const [migrations, heartbeat] = await Promise.all([
      db.execute(sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`),
      db.select().from(instanceMeta).limit(50),
    ]);
    const count = Number(migrations.rows[0]?.count ?? 0);
    const beat = heartbeat.find((row) => row.key === "worker.last_heartbeat")?.value ?? null;
    if (count === 0) {
      return { ready: false, reason: "No migrations applied yet.", migrations: 0, workerHeartbeat: beat };
    }
    return { ready: true, migrations: count, workerHeartbeat: beat };
  } catch (err) {
    return {
      ready: false,
      reason: `Database not reachable: ${err instanceof Error ? err.message : String(err)}`,
      migrations: 0,
      workerHeartbeat: null,
    };
  }
}
