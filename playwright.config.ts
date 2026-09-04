import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results/playwright",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "1440",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "1024",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: "768",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "390",
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @cg/api start",
      url: "http://127.0.0.1:3001/v1/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ??
          process.env.DATABASE_URL ??
          "postgresql://platform:platform@127.0.0.1:5432/platform?schema=public",
        REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
        SESSION_SECRET:
          process.env.SESSION_SECRET ??
          "playwright-session-secret-at-least-32-characters",
        PROVIDER_CALLBACK_SECRET:
          process.env.PROVIDER_CALLBACK_SECRET ??
          "playwright-provider-secret-at-least-32-characters",
        WEB_ORIGIN: "http://127.0.0.1:3000",
        ADMIN_ORIGIN: "http://127.0.0.1:3002",
        APP_MODE: "test",
      },
    },
    {
      command: "pnpm --filter @cg/web start",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @cg/admin start",
      url: "http://127.0.0.1:3002",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
