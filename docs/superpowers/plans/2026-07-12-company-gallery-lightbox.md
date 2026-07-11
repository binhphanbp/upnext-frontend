# Company Gallery Lightbox Implementation Plan

## Goal

Build a custom, flat full-viewport company gallery with a translucent UpNext overlay, modern floating controls, reliable active-thumbnail synchronization, and production-ready desktop/mobile behavior.

## Implementation

### 1. Lock behavior with Playwright

- Extend the company-gallery tests for translucent overlay, toolbar controls, zoom/reset, filmstrip visibility, wrap navigation, focus restoration, and mobile viewport geometry.
- Preserve the regression that navigates to image `15/18` and confirms its active thumbnail is fully visible.
- Confirm the old/first-redesign behavior fails at least one of the new flat-layout or toolbar assertions before implementation.

### 2. Refactor the focused dialog component

- Keep the selected index controlled by `PublicCompanyPage`.
- Keep Radix Dialog for modal lifecycle and focus behavior.
- Make Content full viewport and visually hide Title/Description.
- Consolidate navigation paths through wrap-aware helpers.
- Add zoom controls, fit reset, pointer pan, double-click/tap zoom, fullscreen state, and filmstrip visibility.
- Reset view state on image changes and close.
- Center the active thumbnail on selection and resize.

### 3. Flatten the CSS

- Replace the opaque 3-zone card with a translucent full-viewport overlay.
- Position the counter and toolbar as compact local glass surfaces.
- Center the unframed image in the flexible stage.
- Position previous/next buttons at viewport edges.
- Float thumbnails over a bottom gradient and hide the native scrollbar.
- Add safe-area, mobile, hover/focus, dragging, fullscreen, and reduced-motion states.

### 4. Review and verify

- Run the focused desktop/mobile Playwright gallery tests.
- Inspect desktop `1440 × 900`, tablet, and mobile `390 × 844` for overflow, contrast, control reachability, and console errors.
- Review against UpNext accessibility and web-interface guidelines.
- Run `pnpm verify`, `pnpm build`, and `git diff --check`.
- Commit only the scoped gallery component, parent integration, CSS, tests, and current design/plan documents.
