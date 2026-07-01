// One-time, idempotent migration from the old per-user model (owner_id) to
// shared workspaces. Run AFTER db-push on an existing database.
//
// For each user without a workspace, creates "<name>'s Workspace" and links the
// user; backfills every CRM row's workspace_id from its owner_id -> that user's
// workspace; makes owner_id nullable (so the new code, which omits it, can still
// insert) and workspace_id NOT NULL. Non-destructive: owner_id is kept.
import pg from "pg";
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

async function hasColumn(table, column) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return r.rows.length > 0;
}

const now = new Date();
const CRM = ["companies", "contacts", "deals", "activities"];

try {
  await client.query("BEGIN");

  // 1. A workspace per user that doesn't have one yet.
  const usersNoWs = await client.query(
    `SELECT id, name FROM users WHERE workspace_id IS NULL`,
  );
  for (const u of usersNoWs.rows) {
    const wsId = randomUUID();
    const wsName = `${u.name || "My"}'s Workspace`;
    await client.query(
      `INSERT INTO workspaces (id, name, created_at) VALUES ($1, $2, $3)`,
      [wsId, wsName, now],
    );
    await client.query(`UPDATE users SET workspace_id = $1 WHERE id = $2`, [wsId, u.id]);
  }
  if (usersNoWs.rows.length) {
    await client.query(`ALTER TABLE users ALTER COLUMN workspace_id SET NOT NULL`);
  }
  console.log(`✓ workspaces: linked ${usersNoWs.rows.length} user(s)`);

  // 2. Backfill CRM workspace_id from owner_id, then tidy constraints.
  for (const t of CRM) {
    if (await hasColumn(t, "owner_id")) {
      const res = await client.query(
        `UPDATE ${t} SET workspace_id = u.workspace_id
         FROM users u WHERE ${t}.owner_id = u.id AND ${t}.workspace_id IS NULL`,
      );
      // New code omits owner_id on insert, so it must not be NOT NULL anymore.
      await client.query(`ALTER TABLE ${t} ALTER COLUMN owner_id DROP NOT NULL`);
      console.log(`✓ ${t}: backfilled ${res.rowCount} row(s) from owner_id`);
    }
    // Enforce workspace scoping once every row has a workspace.
    const orphans = await client.query(`SELECT count(*)::int n FROM ${t} WHERE workspace_id IS NULL`);
    if (orphans.rows[0].n === 0) {
      await client.query(`ALTER TABLE ${t} ALTER COLUMN workspace_id SET NOT NULL`);
    } else {
      console.warn(`⚠ ${t}: ${orphans.rows[0].n} row(s) still have no workspace_id — left nullable`);
    }
  }

  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
}

console.log("✓ migration complete");
await client.end();
process.exit(0);
