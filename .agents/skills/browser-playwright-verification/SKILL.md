---
name: browser-playwright-verification
description: Verify Next.js UI changes in a real browser or Playwright. Use after implementing pages, layouts, responsive UI, forms, navigation, animations, or visual states.
metadata:
  author: upnext
  version: "1.0.0"
---

# Browser And Playwright Verification

Use real runtime checks for UI work. Static checks are not enough for layout, routing, hydration, or interaction issues.

## Local Flow

- Start the app with `pnpm dev` unless Playwright `webServer` already does it.
- Test primary routes at desktop and mobile widths.
- Confirm no console errors, hydration errors, obvious layout shifts, clipped text, or broken interactions.
- Use Playwright for repeatable smoke coverage under `e2e/`.

## What To Check

- Route and locale behavior: `/` redirects to `/vi`; `/en` remains available.
- Loading, empty, error, and success states when relevant.
- Keyboard and pointer interactions for forms, menus, dialogs, filters, and tables.
- Responsive behavior at common widths: mobile, tablet, desktop.
- Visual regressions: overlapping text, overflow, missing assets, inaccessible contrast.

## Handoff

- State the browser or Playwright command used.
- Include any route/viewports manually inspected.
- If browser verification was skipped, state why.
