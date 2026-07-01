// Creates the schema on the configured Postgres database (AWS RDS in prod,
// driven by DATABASE_URL). Idempotent.
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

await client.query(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL
);`);

await client.query(`CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  contact TEXT NOT NULL,
  "when" TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL
);`);

// Index the owner scope (idempotent).
await client.query(`CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);`);
await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id);`);

console.log("✓ users + CRM tables (companies, contacts, deals, activities) ready");
await client.end();
process.exit(0);
