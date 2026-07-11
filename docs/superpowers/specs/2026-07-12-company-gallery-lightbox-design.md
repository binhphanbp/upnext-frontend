# Company Gallery Lightbox Design

## Goal

Replace the current company culture-image preview with a polished, immersive lightbox that keeps the active thumbnail visible, works predictably with pointer, keyboard, and touch input, and remains usable across desktop and mobile viewports.

## Confirmed root cause

The current gallery updates `activeCultureImage` but has no thumbnail refs or effect that synchronizes the horizontal rail. At image `15/18`, runtime measurement showed:

- thumbnail rail `scrollLeft`: `0`
- active thumbnail: outside the rail viewport
- `activeFullyVisible`: `false`

The current hand-built `<dialog open>` also lacks the complete modal lifecycle expected from a production dialog: focus containment, reliable focus restoration, background inertness, and a single coordinated close path.

## Product direction

Use a dark, immersive UpNext lightbox that prioritizes the image instead of presenting a floating picture above a visible native scrollbar. The experience should feel calm and editorial rather than decorative or game-like.

### Layout

The dialog has three stable zones:

1. A compact top toolbar with the collection label, an accessible live counter, and a close button.
2. A flexible image stage that uses the available viewport while preserving the image aspect ratio.
3. A bottom filmstrip with edge fades, compact thumbnails, and an UpNext emerald active state.

The shell uses restrained charcoal surfaces, subtle borders, and soft shadows. Navigation controls remain discoverable rather than appearing only on hover.

### Image navigation

- Previous and next buttons wrap between the first and last image.
- `ArrowLeft` and `ArrowRight` navigate while focus is inside the dialog.
- `Home` selects the first image; `End` selects the last image.
- A deliberate horizontal swipe changes the image on touch devices; vertical page-like gestures are ignored.
- Clicking a thumbnail selects it directly.
- Image changes use a short opacity/scale entrance and disable nonessential motion when reduced motion is requested.

### Thumbnail synchronization

The component stores a ref to the filmstrip viewport and each thumbnail. Whenever the active index changes—from arrows, keyboard, swipe, or direct selection—the active thumbnail is scrolled into the visible center of the filmstrip.

The scroll targets only the thumbnail rail, uses `block: "nearest"` and `inline: "center"`, and falls back to immediate movement for reduced-motion users. The filmstrip hides the browser's native scrollbar while preserving wheel, trackpad, drag, and keyboard scrolling.

### Dialog behavior and accessibility

- Build the specialized lightbox on Radix Dialog primitives already installed in the project.
- Opening the gallery moves focus into the dialog, traps it there, makes background content inert, and locks background scrolling.
- Escape, the close button, overlay interaction, or controlled state closure all use one close path.
- Closing restores focus to the gallery item that opened the lightbox.
- The dialog has a programmatic title and description.
- Icon-only controls have explicit labels and visible focus states.
- The active thumbnail uses `aria-current`; the image counter is announced politely when it changes.
- Decorative icons and thumbnails use appropriate hidden/empty alternative text.

### Responsive behavior

- Desktop: a wide stage with a centered filmstrip, generous but bounded spacing, and side navigation controls.
- Tablet: reduced outer padding while retaining the three-zone structure.
- Mobile: nearly edge-to-edge dialog, compact toolbar and thumbnails, always-visible navigation, safe-area-aware padding, and touch swipe support.
- The dialog never creates page-level horizontal scrolling.

## Component boundaries

Create a focused `CompanyGalleryDialog` beside the existing company page. It owns dialog state presentation, image navigation, gesture handling, thumbnail refs, and active-thumbnail synchronization. `PublicCompanyPage` remains responsible only for the selected image index and opening the dialog from the culture grid.

No new dependency or generic shared abstraction is introduced. The existing company gallery data and public route remain unchanged.

## Verification

Extend the existing Playwright company gallery flow before implementation:

- open at image `3/18`
- navigate to `15/18` and assert the active thumbnail is fully inside the filmstrip viewport
- navigate `18 → 1` and `1 → 18`
- verify ArrowLeft, ArrowRight, Home, End, Escape, focus restoration, and direct thumbnail selection
- verify desktop and mobile geometry with no document-level horizontal overflow
- verify dialog semantics, accessible labels, and active thumbnail state

Run `pnpm verify`, `pnpm build`, and the focused Playwright gallery test after implementation.

## Non-goals

- No company data/API migration, image upload workflow, new carousel package, or redesign of unrelated company-profile sections.
- No changes to the shared dialog component unless an actual project-wide defect blocks the specialized gallery.
