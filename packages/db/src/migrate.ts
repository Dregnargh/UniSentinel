import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb, createPool } from "./index";

/**
 * Applies all pending SQL migrations from the given folder.
 * Serialized with a Postgres advisory lock so multiple containers starting at
 * once (cloud) never race; drizzle itself applies each migration atomically.
 */
export async function runMigrations(migrationsFolder: string): Promise<void> {
  const pool = createPool();
  const db = createDb(pool);
  const lock = await pool.connect();
  try {
    // Arbitrary constant application-wide lock id for "schema migration".
    await lock.query("SELECT pg_advisory_lock(727901)");
    await migrate(db, { migrationsFolder });
  } finally {
    await lock.query("SELECT pg_advisory_unlock(727901)").catch(() => {});
    lock.release();
    await pool.end();
  }
}
