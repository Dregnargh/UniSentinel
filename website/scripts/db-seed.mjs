// Seeds a demo admin so you can log in immediately. Idempotent.
import pg from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

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

const email = "admin@unisentinel.com";
const password = "UniSentinel!2026";

const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
if (existing.rows.length) {
  console.log(`✓ demo admin already exists: ${email}`);
  await client.end();
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
await client.query(
  "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
  [randomUUID(), "Ada Auditor", email, passwordHash, "admin", new Date()],
);
console.log(`✓ seeded demo admin → ${email} / ${password}`);
await client.end();
process.exit(0);
