import { defineConfig, devices } from "@playwright/test";

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

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
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
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI
      ? "npm run start-with-server-mocks"
      : "npm run dev-with-mocks",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  /* Opt out of parallel tests. */
  workers: 1,
});
