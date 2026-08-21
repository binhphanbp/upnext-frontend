# Agent Instructions — UpNext Frontend

This is the canonical guide for any coding agent working in this repo (`CLAUDE.md`
and other per-tool files point here — don't duplicate rules into them).

Read [`README.md`](README.md) first for tech stack, project structure, environment
variables, and scripts. This file covers the operational rules README doesn't:
what's non-negotiable, what pattern to follow, and what to verify before calling
something done.

## Non-negotiable

- **Employer, not recruiter, is the canonical hiring-side domain name.** Routes,
  folders, and new code go under `employer`. `recruiter` may only appear as a
  member/permission role _inside_ an employer account — never as a second name
  for the same domain. (`src/features/recruiter/*` predates this rule; don't grow
  it, and don't invent a third name — ask before touching it.)
- **Public pages stay public**, even for a signed-in candidate. Add candidate
  personalization through optional viewer/session data on the same page — never
  by duplicating a public discovery page under `/candidate`. `/candidate/*` is
  reserved for the signed-in workspace only: profile, applications, saved jobs,
  messages, settings.
- **No empty domain folders.** Add a `features/<domain>` folder only in the same
  PR that adds real code for it. No `.gitkeep` placeholders for future work.
- **Don't touch `next-env.d.ts`.** Next.js generates it; it's gitignored on
  purpose.
- **Lucide is not installed.** Use Phosphor Icons (`@phosphor-icons/react`) for
  every icon. Don't add Lucide to fix a missing icon — check Phosphor first.
- **shadcn/ui is adopted selectively, then restyled.** Generating a component is
  the starting point, not the deliverable — restyle the generated source to
  match the existing design system before shipping it.
- Reuse `src/shared/lib/date.ts` for date formatting and
  `src/shared/ui/data-table` as the TanStack Table baseline. Don't hand-roll
  either from scratch.

## Conventions this codebase actually follows

- **Conventional Commits, enforced by commitlint on every commit.** Scope
  matches the feature touched: `feat(recruiter): ...`, `fix(cv-builder): ...`,
  `docs: ...`, `test(e2e): ...`, `chore(agents): ...`, `ci: ...`. Look at
  `git log --oneline` for the exact style before writing a commit message.
- **Three separate session helpers, one per audience** —
  `features/admin/session.ts`, `features/recruiter/session.ts`,
  `features/candidate/session.ts`. Each stores its own token under a distinct
  `localStorage` key. Don't introduce a fourth, and don't let one audience read
  another's session helper.
- **Data mutations follow one shape**: TanStack Query's `useMutation` +
  `getXSession()` inside `mutationFn` (throw `new Error("No session")` if
  missing) + a `sweetalert2` toast on `onSuccess`/`onError` + redirect to the
  audience's `/login` on a `401` from `ApiError`. Look at an existing admin or
  recruiter component (e.g. `features/admin/components/finance/plans/`) before
  inventing a different pattern.
- **`ApiError` (`shared/api/http.ts`) carries the backend's own message.**
  Surface `error.message` directly in the toast for a known `ApiError` instead
  of a generic "something went wrong" — the backend already returns readable
  Vietnamese error text for validation/conflict codes.
- **Tests are colocated**, `*.test.ts` / `*.test.tsx` next to the file they
  cover — not in a separate `__tests__` tree.
- **i18n has two message catalogs that must stay in sync**: `messages/vi.json`
  (default locale) and `messages/en.json`. Adding a UI string means adding the
  key to both files, even if the English copy is a placeholder translation.
  There is no automated parity check yet — you are it.

## Before calling a task done

Run, in order, and fix anything that fails — don't report success on unverified
work:

```bash
pnpm typecheck
pnpm lint
pnpm format:check   # or `pnpm format` to auto-fix, then re-check
pnpm test
```

Equivalent to `pnpm verify`, which is what `pre-push` runs anyway — running it
yourself catches problems before a push, not after CI does.

For UI changes, follow the `browser-playwright-verification` skill
(`.agents/skills/browser-playwright-verification/`): verify in a real browser,
not just by reading the diff. For anything touching forms, navigation, dialogs,
tables, filters, or keyboard interaction, also run the `accessibility-review`
skill.

`pnpm build` and `pnpm test:e2e` (`verify:full`) are slower — CI runs them on
every PR to `main`/`develop`; run them locally yourself when a change plausibly
affects the build or an end-to-end flow, not on every small edit.

## Superpowers plugin

This repo declares the [Superpowers](https://github.com/obra/superpowers)
Claude Code plugin in `.claude/settings.json`. See the "Agent Guidance" section
of `README.md` for the one-time manual install command each machine needs to
run — the declaration alone does not auto-install it.
