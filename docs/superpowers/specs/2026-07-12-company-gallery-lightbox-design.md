# Company Gallery Lightbox Design

## Goal

Replace the company culture-image preview with a flat, full-viewport lightbox inspired by the clarity of lightGallery while remaining custom-built, visually aligned with UpNext, and independent of a carousel dependency.

The image must remain the visual priority. The page behind the lightbox should still be perceptible through a blue-charcoal glass overlay instead of disappearing behind an opaque black modal.

## Confirmed problems

- The original gallery changed the active image without synchronizing the horizontal thumbnail rail. At image `15/18`, the rail remained at `scrollLeft: 0` and the active thumbnail was outside the viewport.
- The first redesign introduced too many visible containers: overlay, large modal card, toolbar row, image frame, and footer card. It read like a dashboard modal rather than a modern image viewer.
- Grid columns reserved for navigation controls reduced the image area, especially on mobile.

## Visual direction

Use three visual layers only:

1. The main image, centered directly in the viewport.
2. Floating glass controls and edge navigation.
3. A thumbnail filmstrip floating over a transparent-to-blue-charcoal bottom gradient.

The Radix dialog content fills the viewport and has no card background, border, radius, or boxed header/footer. The overlay uses a translucent blue-charcoal color at roughly 60–66% opacity with restrained blur so the company page remains visible. Local control surfaces provide sufficient contrast without making the whole viewer opaque.

UpNext emerald is reserved for active thumbnails, focus rings, and deliberate hover emphasis. It is not used as a large background.

### Top controls

- A tabular live counter sits at the top-left.
- A compact glass toolbar sits at the top-right.
- The visible toolbar contains useful viewer controls only: zoom out, current zoom/reset, zoom in, fullscreen, filmstrip visibility, and close.
- The dialog title and usage instructions remain programmatically available but are visually hidden to avoid another header layer.
- All icon controls have Vietnamese accessible names, native tooltips, 44px targets, hover/active states, and strong `:focus-visible` treatment.

### Image stage

- The stage uses all remaining viewport space and reserves only safe breathing room for the top controls and filmstrip.
- The image uses `object-fit: contain`, has no frame or dark card, and receives only a restrained shadow.
- Previous/next controls are absolutely positioned near the viewport edges and never consume image grid columns.
- Image changes use a short opacity transition; reduced-motion users get an immediate change.
- Clicking the empty stage closes the lightbox without treating image, toolbar, navigation, drag, or swipe interactions as backdrop clicks.

### Filmstrip

- The filmstrip floats at the bottom over a single gradient, with no footer card or native scrollbar.
- Desktop thumbnails are approximately `84 × 56px`; mobile thumbnails are approximately `64 × 44px`.
- The active thumbnail has an emerald border plus opacity/scale emphasis and `aria-current`.
- Whenever navigation changes the active image, the rail centers the active thumbnail. It re-centers after a resize or orientation change.
- The user can hide the filmstrip to maximize image space and restore it from the toolbar.

## Interaction model

- Previous/next buttons wrap from first to last and last to first.
- `ArrowLeft`, `ArrowRight`, `Home`, and `End` navigate.
- `+`, `-`, and `0` control zoom/reset.
- A deliberate horizontal swipe navigates when the image is at fit scale.
- Zoom supports toolbar control, double-click/tap, pointer pan while enlarged, and reset on image change.
- Fullscreen uses the browser Fullscreen API when available and exits cleanly when the dialog closes.
- Direct thumbnail selection remains available.
- Escape closes the dialog, focus stays trapped while open, and focus returns to the gallery item that opened it.

The viewer intentionally excludes share, rotate, flip, autoplay, and forced downloads. Those controls add noise or content-rights ambiguity without meaningful value for a recruitment-company gallery.

## Accessibility and responsive behavior

- Build on installed Radix Dialog primitives for focus containment, background inertness, Escape handling, and body-scroll locking.
- Use a programmatic title/description, polite live counter, descriptive image alternatives, decorative empty thumbnail alternatives, and explicit control labels.
- Touch targets are at least 44px. Full-bleed areas account for safe-area insets.
- The viewer never creates document-level horizontal overflow.
- On mobile, the toolbar remains within the viewport, arrows stay reachable, and the image stage remains larger than the chrome.
- All entrance, image, toolbar, and filmstrip motion honors `prefers-reduced-motion`.

## Component boundaries

`CompanyGalleryDialog` owns presentation, navigation, zoom/pan state, fullscreen state, gesture handling, focus restoration, thumbnail refs, and rail synchronization. `PublicCompanyPage` owns only the selected image index and gallery opening buttons.

No new dependency, API change, or shared abstraction is introduced.

## Verification

Playwright coverage must verify:

- translucent overlay and full-viewport flat content
- desktop and mobile controls remain inside the viewport
- navigation to `15/18` centers the active thumbnail
- first/last wrapping and Arrow/Home/End behavior
- zoom in/out/reset and reset after image navigation
- filmstrip hide/show state
- Escape closure and opener focus restoration
- no document horizontal overflow at `390 × 844`
- dialog semantics, live counter, accessible labels, and active thumbnail state

Run the focused gallery Playwright tests, `pnpm verify`, and `pnpm build` before handoff.
