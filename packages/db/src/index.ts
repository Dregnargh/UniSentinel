import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema/index";

export * from "./schema/index";
export { schema };

export type Db = NodePgDatabase<typeof schema>;

/**
 * TLS config shared by the app, worker and migrator.
 *  - DATABASE_SSL=false        -> plaintext (local dev / same-host on-prem)
 *  - DATABASE_CA_CERT set      -> verified TLS against that CA (RDS, corporate CA)
 *  - otherwise                 -> encrypted but unverified (last resort)
 */
export function sslConfig(): PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL === "false") return undefined;
  if (process.env.DATABASE_CA_CERT) {
    return { ca: process.env.DATABASE_CA_CERT, rejectUnauthorized: true };
  }
  return { rejectUnauthorized: false };
}

export function createPool(connectionString?: string): Pool {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new Pool({
    connectionString: url,
    ssl: sslConfig(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
  });
}

export function createDb(pool: Pool): Db {
  return drizzle(pool, { schema });
}
