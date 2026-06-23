// Seeds a demo admin so you can log in immediately. Idempotent.
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const client = createClient(authToken ? { url, authToken } : { url });

const email = "admin@unisentinel.com";
const password = "UniSentinel!2026";

const existing = await client.execute({
  sql: "SELECT id FROM users WHERE email = ?",
  args: [email],
});
if (existing.rows.length) {
  console.log(`✓ demo admin already exists: ${email}`);
  process.exit(0);
}

const passwordHash = await bcrypt.hash(password, 10);
await client.execute({
  sql: "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  args: [randomUUID(), "Ada Auditor", email, passwordHash, "admin", Math.floor(Date.now() / 1000)],
});
console.log(`✓ seeded demo admin → ${email} / ${password}`);
process.exit(0);
