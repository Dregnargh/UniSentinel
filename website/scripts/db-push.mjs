// Creates the schema on the configured database (local file in dev, Turso in
// prod — driven by DATABASE_URL / DATABASE_AUTH_TOKEN). Idempotent.
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const client = createClient(authToken ? { url, authToken } : { url });

await client.execute(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at INTEGER NOT NULL
);`);

await client.execute(`CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  size TEXT NOT NULL,
  location TEXT NOT NULL,
  risk_tier TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Prospect',
  owner TEXT NOT NULL,
  frameworks TEXT NOT NULL DEFAULT '[]',
  arr REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);`);

await client.execute(`CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Lead',
  last_touch TEXT NOT NULL,
  created_at INTEGER NOT NULL
);`);

await client.execute(`CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value REAL NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'Lead',
  owner TEXT NOT NULL,
  probability INTEGER NOT NULL DEFAULT 0,
  close_date TEXT NOT NULL,
  created_at INTEGER NOT NULL
);`);

await client.execute(`CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  contact TEXT NOT NULL,
  "when" TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);`);

// Index the owner scope + common lookups (idempotent).
await client.execute(`CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);`);
await client.execute(`CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_id);`);
await client.execute(`CREATE INDEX IF NOT EXISTS idx_deals_owner ON deals(owner_id);`);
await client.execute(`CREATE INDEX IF NOT EXISTS idx_activities_owner ON activities(owner_id);`);

console.log(`✓ users + CRM tables (companies, contacts, deals, activities) ready on ${url}`);
process.exit(0);
