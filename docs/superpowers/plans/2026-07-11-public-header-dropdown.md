# Public Header Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public-header dropdown readable, viewport-safe, and keyboard-operable without changing UpNext's navigation content or visual identity.

**Architecture:** Keep `PublicHeader` as the single shared navigation component. Model each dropdown as a disclosure button controlling a labelled panel with a semantic link list; keep pointer hover as enhancement. Fix the overflow at its CSS source and verify geometry plus keyboard state in Playwright.

**Tech Stack:** Next.js App Router, React, TypeScript, next-intl navigation, Tailwind v4/global CSS, Playwright, pnpm.

---

### Task 1: Lock the broken layout and interaction into Playwright

**Files:**

- Modify: `e2e/home.spec.ts`

- [ ] **Step 1: Extend the failing regression test**

Use the existing `keeps every public header mega menu readable and inside the viewport` test. Cover `1280`, `1440`, and `1920` pixel widths, and for every trigger assert:

```ts
const geometry = await panel.evaluate((element) => {
  const panelRect = element.getBoundingClientRect();
  const items = Array.from(element.querySelectorAll<HTMLElement>(".marketing-home-mega-item"));

  return {
    panelInsideViewport: panelRect.left >= 0 && panelRect.right <= window.innerWidth,
    pageHasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    overflowingItems: items
      .filter((item) => item.scrollWidth > item.clientWidth)
      .map((item) => item.textContent?.trim()),
    nonWrappingDescriptions: Array.from(
      element.querySelectorAll<HTMLElement>(".marketing-home-mega-text small"),
    ).filter((description) => getComputedStyle(description).whiteSpace !== "normal").length,
  };
});
```

Open by keyboard, assert `aria-expanded="true"`, assert destination elements are links, press Escape, then assert the panel is hidden, `aria-expanded="false"`, and focus returned to the same trigger.

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
pnpm exec playwright test e2e/home.spec.ts --grep "keeps every public header mega menu"
```

Expected: FAIL because inherited `white-space: nowrap` leaves non-wrapping descriptions and Escape does not return focus.

### Task 2: Implement semantic disclosure navigation and resilient layout

**Files:**

- Modify: `src/features/public/shared/public-header.tsx`
- Modify: `src/features/public/home/marketing-home.css`
- Test: `e2e/home.spec.ts`

- [ ] **Step 1: Replace the incomplete ARIA menu pattern**

Import localized `Link`, add stable trigger/panel IDs, and render destinations as links in a list:

```tsx
<button
  id={`public-nav-${menu.key}-trigger`}
  aria-expanded={openMenu === menu.key}
  aria-controls={`public-nav-${menu.key}-panel`}
>
  {label}
</button>
<div
  id={`public-nav-${menu.key}-panel`}
  aria-labelledby={`public-nav-${menu.key}-trigger`}
  className="marketing-home-mega"
>
  <ul className="marketing-home-mega-grid">
    <li>
      <Link className="marketing-home-mega-item" href={item.path} onClick={closeMenu}>
        {content}
      </Link>
    </li>
  </ul>
</div>
```

Remove `role="menu"` and `role="menuitem"`. Mark decorative icons as hidden from assistive technology.

- [ ] **Step 2: Complete keyboard and focus behavior**

When Escape is pressed, locate the active trigger by its stable ID, close the panel, and return focus:

```ts
if (event.key === "Escape") {
  const trigger = document.getElementById(`public-nav-${openMenu}-trigger`);
  setOpenMenu(null);
  trigger?.focus();
}
```

On each dropdown wrapper, close only when focus moves outside that wrapper:

```tsx
onBlur={(event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null);
}}
```

Keep click and hover support; clicking a destination or outside the navigation closes the active panel.

- [ ] **Step 3: Fix CSS specificity and width constraints**

Remove `white-space: nowrap` from `.marketing-home-nav button` and apply it only to `.marketing-home-nav-trigger`. Keep dropdown content shrinkable and readable:

```css
.marketing-home-nav-trigger {
  white-space: nowrap;
}

.marketing-home-mega {
  width: min(640px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
}

.marketing-home-mega.is-single {
  width: min(360px, calc(100vw - 32px));
}

.marketing-home-mega-grid {
  margin: 0;
  padding: 0;
  list-style: none;
}

.marketing-home-mega-grid > li,
.marketing-home-mega-item,
.marketing-home-mega-text {
  min-width: 0;
}

.marketing-home-mega-item,
.marketing-home-mega-text small {
  white-space: normal;
}
```

Preserve current colors, shadows, spacing, two-column/single-column structure, and reduced-motion behavior.

- [ ] **Step 4: Run GREEN verification for the regression**

Run:

```bash
pnpm exec playwright test e2e/home.spec.ts --grep "keeps every public header mega menu"
```

Expected: 1 passed.

### Task 3: Verify the branch

**Files:**

- Verify: `src/features/public/shared/public-header.tsx`
- Verify: `src/features/public/home/marketing-home.css`
- Verify: `e2e/home.spec.ts`

- [ ] **Step 1: Run repository verification**

```bash
pnpm verify
```

Expected: typecheck, lint, format check, and unit tests all pass.

- [ ] **Step 2: Run the relevant browser suite**

```bash
pnpm exec playwright test e2e/home.spec.ts
```

Expected: all header tests pass. If unrelated legacy homepage assertions fail, report them separately and keep the focused dropdown regression green.

- [ ] **Step 3: Inspect the final diff**

```bash
git diff --check
git status -sb
git diff -- src/features/public/shared/public-header.tsx src/features/public/home/marketing-home.css e2e/home.spec.ts
```

Expected: no whitespace errors and no unrelated candidate-profile files.

- [ ] **Step 4: Commit the scoped change**

```bash
git add src/features/public/shared/public-header.tsx src/features/public/home/marketing-home.css e2e/home.spec.ts docs/superpowers/specs/2026-07-11-public-header-dropdown-design.md docs/superpowers/plans/2026-07-11-public-header-dropdown.md
git commit -m "fix(public): harden header dropdown navigation"
```
