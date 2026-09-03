import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      { test: { name: "unit", include: ["**/*.unit.test.ts"] } },
      {
        test: {
          name: "integration",
          include: ["**/*.integration.test.ts"],
        },
      },
      { test: { name: "smoke", include: ["**/*.smoke.test.ts"] } },
    ],
  },
});
