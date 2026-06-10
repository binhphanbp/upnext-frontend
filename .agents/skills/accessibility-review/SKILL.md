---
name: accessibility-review
description: Review UpNext UI for practical accessibility issues. Use when adding or reviewing forms, navigation, dialogs, tables, filters, keyboard interactions, or user-facing UI.
metadata:
  author: upnext
  version: "1.0.0"
---

# Accessibility Review

Use this as a focused checklist, not a reason to refactor unrelated UI.

## Check

- Semantic HTML: correct headings, labels, buttons, links, lists, tables, and landmarks.
- Keyboard: all interactive controls are reachable, visible focus exists, Escape/Enter behavior is predictable.
- Forms: every field has a label, error text is associated with the field, required state is clear.
- Dialogs/popovers: focus is trapped/restored when needed; background content is not accidentally reachable.
- Tables: headers describe cells; empty/loading/error states are announced or visibly clear.
- Visual accessibility: contrast, text overflow, responsive layout, reduced motion, and non-color-only status cues.
- Internationalization: user-facing text should use next-intl where product UI needs translations.

## Verify

- Prefer Testing Library role/name queries for unit or component tests.
- For flows, use Playwright to exercise keyboard navigation and core interactions.
- Report findings as `file:line - issue - suggested fix`.
