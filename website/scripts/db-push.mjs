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

console.log(`✓ users table ready on ${url}`);
process.exit(0);
