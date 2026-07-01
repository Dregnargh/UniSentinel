import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema";

// Postgres (AWS RDS in production). The pool is created once per server
// instance. On serverless, keep the per-instance pool small and prefer an
// RDS Proxy / PgBouncer in front of RDS to avoid exhausting connections.
//
// SSL: RDS requires TLS. Provide the RDS CA bundle via DATABASE_CA_CERT to
// verify the server certificate (recommended for production / compliance).
// Without a CA, we still encrypt but skip verification. Set DATABASE_SSL=false
// only for a plaintext local Postgres.
export function sslConfig(): PoolConfig["ssl"] {
  if (process.env.DATABASE_SSL === "false") return false;
  const ca = process.env.DATABASE_CA_CERT;
  if (ca) return { ca, rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the pool across HMR reloads / lambda invocations in the same instance.
const globalForDb = globalThis as unknown as { __pgPool?: Pool };

const pool =
  globalForDb.__pgPool ??
  new Pool({
    connectionString,
    ssl: sslConfig(),
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__pgPool = pool;

export const db = drizzle(pool, { schema });
