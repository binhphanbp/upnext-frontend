# Featured Companies Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present a balanced desktop featured-companies bento with eight compact company cards and a shorter spotlight panel.

**Architecture:** Keep the API and carousel data intact. Change only the desktop visible-card limit, then align the spotlight grid span and content spacing with the resulting four-row grid. Existing responsive breakpoints continue to supply six cards at tablet and zero cards at mobile.

**Tech Stack:** Next.js, React, CSS Grid, Playwright.

---

### Task 1: Write and run the failing composition test

**Files:**
- Create: `e2e/home-featured-companies.spec.ts`

- [ ] At viewport 1440×1200, navigate to `/vi`, scope to `.marketing-home-companies`, assert 8 `.featured-company-card` elements, and assert the spotlight's computed `grid-row` is `2 / span 3`.
- [ ] Run `pnpm exec playwright test e2e/home-featured-companies.spec.ts --reporter=line`; it must fail because the current view has 11 cards and spans four rows.

### Task 2: Render four complete rows only at desktop

**Files:**
- Modify: `src/features/public/home/featured-companies.tsx`
- Test: `e2e/home-featured-companies.spec.ts`

- [ ] Set the SSR/default and desktop `useVisibleCount` return value to 8; retain existing values of 6 for tablet and 0 for mobile.
- [ ] Run the focused Playwright test; the card-count assertion must pass and the grid-span assertion must still fail.

### Task 3: Shorten and rebalance the spotlight panel

**Files:**
- Modify: `src/features/public/home/marketing-home.css`
- Test: `e2e/home-featured-companies.spec.ts`

- [ ] Change `.featured-company-featured` from `grid-row: 2 / span 4` to `grid-row: 2 / span 3`.
- [ ] Reduce cover to 154px, body padding to `14px 22px 18px`, description to two clamped lines with 10px top margin, jobs top margin to 12px, and action padding-top to 14px.
- [ ] Run the focused Playwright test; it must pass.

### Task 4: Verify and publish

**Files:**
- Modify: none

- [ ] Run `pnpm typecheck` and `pnpm lint`.
- [ ] Run `pnpm exec playwright test e2e/home-featured-companies.spec.ts --reporter=line`.
- [ ] Inspect `/vi` at 1440px and 768px, confirming no clipped card content and keyboard-focusable carousel/follow controls.
- [ ] Commit only implementation and test files as `fix(home): balance featured companies`, push `feature/home-featured-companies-balance`, and open a PR into `develop`.
