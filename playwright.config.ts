import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // On CI, the inline annotations tell a reviewer which test broke, and the HTML report
  // carries the trace from the retry that reproduced it — without it a failure in the
  // pipeline can only be investigated by re-running the suite locally and hoping.
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "node -e \"const fs=require('fs');fs.cpSync('public','.next/standalone/public',{recursive:true});fs.cpSync('.next/static','.next/standalone/.next/static',{recursive:true});\" && node .next/standalone/server.js",
    url: `${baseURL}/vi`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // The standalone server binds to `HOSTNAME`, which CI runners and most developer
    // machines already set to the machine name. It then listens on an address that
    // `localhost:3000` does not reach, and the suite dies waiting for a server that is
    // running perfectly well on an address nobody asked for.
    env: { HOSTNAME: "127.0.0.1" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
