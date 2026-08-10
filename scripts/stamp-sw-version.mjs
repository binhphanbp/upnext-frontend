#!/usr/bin/env node
// Stamps public/sw.js with the Next.js build ID so its cache name changes on
// every real deploy. Without this, CACHE_NAME never changes, so the
// "delete every cache that isn't CACHE_NAME" cleanup in sw.js's `activate`
// handler never fires and old builds' cached assets accumulate forever.
//
// Run explicitly from the Dockerfile after `next build` — NOT wired as a
// package.json postbuild hook, so a bare local `pnpm build` never mutates
// the tracked public/sw.js on a developer's machine.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
const swPath = join(process.cwd(), "public", "sw.js");

if (!existsSync(buildIdPath)) {
  console.error("stamp-sw-version: .next/BUILD_ID not found — run `next build` first.");
  process.exit(1);
}

const buildId = readFileSync(buildIdPath, "utf8").trim();
const sw = readFileSync(swPath, "utf8");

if (!sw.includes("__CACHE_VERSION__")) {
  console.error(
    "stamp-sw-version: public/sw.js has no __CACHE_VERSION__ placeholder left to stamp.",
  );
  process.exit(1);
}

writeFileSync(swPath, sw.replace("__CACHE_VERSION__", buildId));
console.log(`stamp-sw-version: stamped public/sw.js with build ${buildId}`);
