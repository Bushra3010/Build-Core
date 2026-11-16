import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests.
 *  - Default: builds the static site and serves ./out on port 4321.
 *  - E2E_BASE_URL=https://bushra3010.github.io/Build-Core/ runs the same suite against the live site.
 * Tests use relative URLs ("./tenders/") so they work under a base path too.
 */
const external = process.env.E2E_BASE_URL;
const baseURL = external ? external.replace(/\/?$/, "/") : "http://localhost:4321/";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: external
    ? undefined
    : {
        command: "npm run build && npx serve@14.2.4 out -l 4321 --no-request-logging",
        url: "http://localhost:4321/",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
