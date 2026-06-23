import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

// This site lives in a subdirectory of the design-system repo (which has its
// own lockfile). Pin the workspace root to THIS folder so Next's file tracing
// + Turbopack resolve against the site, not the parent.
// Use import.meta.url — `__dirname` is undefined when next.config.ts loads as
// ESM, which previously resolved this to the repo root and broke Vercel's
// build-output collection (`ENOENT .next/package.json` at the repo root).
const here = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: { root: here },
  outputFileTracingRoot: here,
};

export default nextConfig;
