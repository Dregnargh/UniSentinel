// Lazy database access for the web process.
//
// IMPORTANT: nothing here runs at import time — the app must boot (and
// /healthz must answer) even when DATABASE_URL is unset or the database is
// down, so probes and the setup experience can report a useful state instead
// of crash-looping.
import { createDb, createPool, type Db } from "@unisentinel/db";
import type { Pool } from "pg";

type DbHandle = { pool: Pool; db: Db };

const globalCache = globalThis as unknown as { __usDb?: DbHandle };

export function getDb(): DbHandle {
  if (!globalCache.__usDb) {
    const pool = createPool();
    globalCache.__usDb = { pool, db: createDb(pool) };
  }
  return globalCache.__usDb;
}
