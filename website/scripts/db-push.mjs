// Creates / updates the schema on the configured Postgres database (AWS RDS in
// prod, driven by DATABASE_URL). Idempotent. Safe on both a fresh database and
// an existing one (adds missing columns via ADD COLUMN IF NOT EXISTS).
//
// For an existing database that still has the old per-user `owner_id` columns,
// run scripts/migrate-workspaces.mjs AFTER this to backfill workspaces.
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("✗ DATABASE_URL is not set");
  process.exit(1);
}

function sslConfig() {
  if (process.env.DATABASE_SSL === "false") return false;
  const ca = process.env.DATABASE_CA_CERT;
  if (ca) return { ca, rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

const client = new pg.Client({ connectionString, ssl: sslConfig() });
await client.connect();

// --- Workspaces & users ---
await client.query(`CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);`);

await client.query(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL
);`);
// Existing installs: add the new user columns if missing.
await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;`);
await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;`);

// --- CRM tables (fresh installs get workspace_id directly) ---
await client.query(`CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  size TEXT NOT NULL,
  location TEXT NOT NULL,
  risk_tier TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Prospect',
  owner TEXT NOT NULL,
  frameworks JSONB NOT NULL DEFAULT '[]'::jsonb,
  arr DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL
);`);

await client.query(`CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Lead',
  last_touch TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);`);

await client.query(`CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'Lead',
  owner TEXT NOT NULL,
  probability INTEGER NOT NULL DEFAULT 0,
  close_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);`);

await client.query(`CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  contact TEXT NOT NULL,
  "when" TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL
);`);

// Existing installs: add workspace_id to CRM tables if missing.
for (const t of ["companies", "contacts", "deals", "activities"]) {
  await client.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_${t}_workspace ON ${t}(workspace_id);`);
}
await client.query(`CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);`);

console.log("✓ workspaces + users + CRM tables ready");
await client.end();
process.exit(0);
