import { defineConfig, devices } from "@playwright/test";

// Ensure the test runner process uses UTC, matching the browser (timezoneId)
// and the dev server (webServer.env.TZ).
process.env.TZ = "UTC";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Run tests in files in parallel */
  fullyParallel: true,

  globalSetup: "./playwright/global-setup.ts",
  globalTeardown: "./playwright/global-tear-down.ts",

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Look for tests in the playwright directory */
  testDir: "./playwright",
  /* Match tests with the .e2e.ts extension */
  testMatch: "*.e2e.ts",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: process.env.APP_URL ?? "http://localhost:3000",
    timezoneId: "UTC",
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI ? "bun run start" : "bun run dev",
    env: {
      EMAIL_MOCKS: "true",
      MOCKS: "true",
      NODE_ENV: "test",
      TZ: "UTC",
    },
    reuseExistingServer: !process.env.CI,
    url: process.env.APP_URL ?? "http://localhost:3000",
  },
  /* Opt out of parallel tests. */
  workers: 1,
});
