import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/**/*.test.ts"],
          exclude: ["test/**/*.integration.test.ts"],
          setupFiles: ["./test/unitSetup.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["test/**/*.integration.test.ts"],
          setupFiles: ["./test/integrationSetup.ts"],
          fileParallelism: false,
          hookTimeout: 30_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text"],
      exclude: ["tests/**"],
    },
  },
})
