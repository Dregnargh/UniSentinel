import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["platform/**/*.test.ts", "modules/**/*.test.ts", "worker/**/*.test.ts"],
  },
});
