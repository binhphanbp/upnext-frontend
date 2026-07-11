# Public Header Dropdown Design

## Goal

Repair the public-header dropdowns so Vietnamese and English content remains readable, panels stay inside the viewport, and navigation works consistently with pointer and keyboard input.

## Root cause

The broad `.marketing-home-nav button` selector applies `white-space: nowrap` to every button inside the navigation. Its specificity is higher than `.marketing-home-mega-item`, so the attempted `white-space: normal` override loses. Descriptions inherit `nowrap`, expand past their grid tracks, overlap the adjacent column, or get clipped by single-column panels.

The dropdown also declares the ARIA menu pattern without implementing that pattern's keyboard behavior. For site navigation, a disclosure with ordinary links is simpler and more predictable.

## Approved design

- Scope the single-line rule to the top-level trigger only.
- Let dropdown titles and descriptions wrap naturally; do not truncate navigation descriptions.
- Keep every grid/flex text child shrinkable with `min-width: 0`.
- Cap two-column and single-column panel widths against the viewport.
- Keep the current UpNext colors, spacing, menu groups, and desktop visual hierarchy.
- Render destinations as links inside a semantic list instead of action buttons with incomplete `menuitem` behavior.
- Preserve hover as a desktop enhancement while click, Enter, Space, Tab, Escape, outside click, and focus return remain reliable.
- At the existing mobile breakpoint, keep using the mobile header rather than forcing the desktop mega-menu into a narrow viewport.

## Error and edge states

- Long Vietnamese/English labels wrap without intersecting another item.
- The first and last dropdowns cannot extend beyond the left or right viewport edge.
- Switching between dropdowns never leaves two panels visible.
- Escape closes the active panel and returns focus to its trigger.
- Clicking a destination or outside the navigation closes the panel.
- Reduced-motion users receive no essential information through animation.

## Verification

- Add a focused component test for disclosure state, semantic links, Escape, and focus return.
- Add a Playwright regression for all four dropdowns at 1920, 1440, and 1280 pixels: no panel overflow, no item overflow/intersection, and no horizontal document scroll.
- Exercise keyboard opening, tab navigation, and Escape closing.
- Run `pnpm verify`; use the existing local server for the browser checks.

## Non-goals

- No content rewrite, navigation-information architecture change, new dependency, or unrelated homepage redesign.
- No route/view-transition animation changes.
