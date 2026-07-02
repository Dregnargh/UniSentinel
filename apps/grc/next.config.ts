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
  // pdfkit loads its font metrics (.afm) from disk relative to __dirname —
  // bundling breaks that path. Keep it a runtime require; the file tracer
  // then ships the whole package (fonts included) in the standalone output.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
