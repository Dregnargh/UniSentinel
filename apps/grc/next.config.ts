import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hostable server bundle: .next/standalone runs anywhere Node runs
  // (Docker on Linux, native Windows service, plain VM). No serverless
  // assumptions anywhere in this app.
  output: "standalone",
  // Monorepo: trace files from the repo root so workspace packages
  // (@unisentinel/ui, @unisentinel/db) are included in the standalone output.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  // @unisentinel/db ships TypeScript source (no build step); Next transpiles it.
  transpilePackages: ["@unisentinel/db"],
};

export default nextConfig;
