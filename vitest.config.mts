import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Pages in app/ are server-rendered compositions of these; `next build` fails on any content error.
      include: ["components/**", "lib/**"],
      exclude: ["**/*.d.ts"],
      thresholds: { 100: true },
    },
  },
});
