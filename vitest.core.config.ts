import { defineConfig } from "vitest/config";
import path from "path";

// Pure unit/fixture tests (import resolution, ranker, layouts, sync planning, chat shape...). No database and no setup file.
// Run with: npm run test:core
export default defineConfig({
  test: { environment: "node", include: ["scripts/**/*.test.ts"], testTimeout: 30000 },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
