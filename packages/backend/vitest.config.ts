import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: ["node_modules", "dist", "src/test-*.ts", "src/test/**"],
    testTimeout: 10000,
  },
});
