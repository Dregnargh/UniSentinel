// Bundles the worker and the migration runner into self-contained CJS files so
// the runtime image/service needs no node_modules for them (pg, pg-boss and
// drizzle are pure JS and bundle cleanly; pg-native is an optional native
// binding we exclude).
import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const shared = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["pg-native"],
  logLevel: "warning",
  sourcemap: true,
};

await esbuild.build({
  ...shared,
  entryPoints: [path.join(appRoot, "worker/index.ts")],
  outfile: path.join(appRoot, "dist/worker.cjs"),
});

await esbuild.build({
  ...shared,
  entryPoints: [path.join(appRoot, "worker/migrate-cli.ts")],
  outfile: path.join(appRoot, "dist/migrate.cjs"),
});

console.log("[build-worker] dist/worker.cjs + dist/migrate.cjs written");
