import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This site lives in a subdirectory of the design-system repo (which also has
  // a lockfile). Pin the workspace root so file tracing + Turbopack resolve
  // against the site, not the parent.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
