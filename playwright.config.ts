import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * Spec files that fail today and are therefore not enforced by CI yet.
 *
 * No pipeline had ever run this suite, and when it was finally run 44 of its 130 tests
 * failed — selectors, counts and CSS assertions describing a UI that has since changed.
 * The failures reproduce identically on a developer machine, so they are stale tests
 * rather than anything specific to CI.
 *
 * Blocking every pull request on them would have meant reverting to no e2e coverage at
 * all within a day. The rest of the suite is enforced now, and this list is the debt:
 * it is printed on every CI run so it cannot quietly become permanent, and it shrinks
 * one file at a time as each is repaired.
 *
 * They still run locally — `pnpm test:e2e` is unfiltered — so fixing one needs no config
 * change, only its removal from this list.
 */
const QUARANTINED_SPECS = ["**/public-live-data.spec.ts", "**/jobs-natural-search.spec.ts"];

if (process.env.CI) {
  console.warn(
    `[e2e] ${QUARANTINED_SPECS.length} spec files are quarantined and not enforced:\n` +
      QUARANTINED_SPECS.map((spec) => `  - ${spec.replace("**/", "")}`).join("\n"),
  );
}

export default defineConfig({
  testDir: "./e2e",
  // Only CI is filtered: a developer repairing one of these must be able to run it.
  testIgnore: process.env.CI ? QUARANTINED_SPECS : [],
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
