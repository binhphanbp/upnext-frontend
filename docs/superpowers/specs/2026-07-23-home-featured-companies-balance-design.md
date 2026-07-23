# Featured companies balance

## Goal

Make the homepage's “Công ty công nghệ tiêu biểu” composition feel intentional at desktop widths by removing the incomplete fifth grid row and shortening the adjacent featured-company panel to match.

## Scope

- Render the first eight companies in the two-column compact-card grid (four complete rows).
- Keep the existing featured-company carousel, image, company details, job count, and two actions.
- Reduce the desktop featured panel height and redistribute its internal spacing so its cover, copy, and actions remain legible and visually balanced with the four-row grid.
- Preserve the existing single-column responsive layout and keyboard-operable carousel controls.

## Non-goals

- No change to company API contract, carousel navigation behavior, follow-state behavior, or copy.
- No removal of companies from the underlying data; the ninth and tenth companies remain available on later carousel pages/data updates.

## Verification

- Playwright regression coverage asserts that desktop renders eight compact company cards and no incomplete fifth row.
- Inspect desktop and mobile layouts, including focusable controls and clipped text.
