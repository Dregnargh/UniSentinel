// Container/service entrypoint step: apply pending migrations, then exit.
// Bundled to dist/migrate.cjs; the migrations SQL folder is passed as argv[2]
// (defaults to ./migrations next to the bundle).
import path from "node:path";
import { runMigrations } from "@unisentinel/db/migrate";
import { createLogger } from "../platform/log";

const log = createLogger("migrate");

const folder = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "migrations");

runMigrations(folder)
  .then(() => {
    log.info("migrations applied", { folder });
    process.exit(0);
  })
  .catch((err) => {
    log.error("migration failed", { folder, error: String(err) });
    process.exit(1);
  });
