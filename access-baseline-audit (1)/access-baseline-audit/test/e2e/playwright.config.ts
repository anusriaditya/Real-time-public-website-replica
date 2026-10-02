import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  outputDir: "../test-results",
  reporter: [["html", { outputFolder: "../report", open: "never" }]],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Boots the real client (and expects the server already running on :4000,
  // see docs/README.md "Local setup") before the suite starts.
  webServer: {
    command: "pnpm --filter @access-audit/client dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    cwd: "../..",
  },
});
