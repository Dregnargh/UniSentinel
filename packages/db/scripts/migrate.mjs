// CLI migration runner for local dev / ops: `npm run migrate -w @unisentinel/db`.
// Reads .env from the package dir if present (node --env-file is opt-in, so we
// keep this dependency-free and read DATABASE_URL from the environment).
// The production containers use the esbuild-bundled dist/migrate.cjs instead.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(here, "..");

// Run the TS migrator through the repo's TypeScript-aware loader-free path:
// drizzle-kit ships a plain `migrate` command that reads drizzle.config.ts.
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["drizzle-kit", "migrate"],
  { cwd: pkgRoot, stdio: "inherit", env: process.env },
);
process.exit(result.status ?? 1);
