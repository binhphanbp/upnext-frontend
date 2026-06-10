# UpNext Frontend Agent Guide

Keep this file short. Follow it before changing code.

## Project

- UpNext FE: IT recruitment platform.
- Stack: Next.js App Router, strict TS, Tailwind v4, next-intl, TanStack Query/Table, RHF + Zod, Zustand, date-fns, Motion, Phosphor Icons, shadcn/ui, MSW, Vitest, Playwright, Oxlint/Oxfmt.
- pnpm only. Use Node/pnpm versions from `.node-version`, `.nvmrc`, and `package.json`.
- Lucide is not installed.

## Operating Rules

- State assumptions when requirements are ambiguous.
- Keep changes simple, scoped, and surgical. Do not refactor adjacent code unless required.
- Do not add abstractions, config, dependencies, or shadcn components for hypothetical needs.
- Mention unrelated issues instead of fixing them silently.
- Every handoff must include verification commands run.

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check` / `pnpm format`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm verify`
- `pnpm verify:full`

Run `pnpm verify` for normal changes. Run `pnpm verify:full` for routes, app shell, providers, or E2E behavior.

## Architecture

- Feature-First Hybrid:
  - `src/app/[locale]`: localized routes/layouts/metadata/composition only.
  - `src/features/<domain>`: domain UI, hooks, schemas, API calls, types, tests.
  - `src/shared`: reusable `api`, `lib`, `ui`, hooks, stores, types.
  - `src/i18n`, `messages`, `src/mocks`, `src/test`, `e2e`.
- Expected domains: `auth`, `jobs`, `companies`, `candidates`, `applications`, `messages`, `notifications`, `employer-dashboard`, `admin`, `search`.
- Avoid business logic in `src/app`. Routes compose feature/shared modules.
- Preferred feature shape: `api/`, `components/`, `hooks/`, `schemas/`, `types.ts`, colocated `*.test.ts(x)`.
- Use `@/*` imports.

## Coding Rules

- Prefer Server Components. Add `"use client"` only for hooks, browser APIs, events, Zustand, React Query, or client-only libraries.
- TanStack Query owns server state. Zustand is only for client/UI state.
- Forms use React Hook Form + Zod.
- UI text uses next-intl when product-facing.
- Icons come from `@phosphor-icons/react`; animation imports come from `motion/react`.
- Use Tailwind v4 and `cn()` from `src/shared/lib/cn.ts`.
- Use `src/shared/lib/date.ts` for date formatting and `src/shared/ui/data-table` for table baseline.
- Figma/product design is the UI source of truth. shadcn/ui is only a source-code starter for accessible primitives.
- Generated shadcn files live in `src/shared/ui`, are project-owned code, and must be restyled to UpNext.
- Never edit generated files: `next-env.d.ts`, `public/mockServiceWorker.js`.
- Never expose secrets. Public env vars must start with `NEXT_PUBLIC_` and be validated in `src/shared/lib/env.ts`.
- Feature API wrappers should build on `src/shared/api`.

## Skills

- Use Vercel React Best Practices as a performance checklist; do not add dependencies or rewrite architecture because of it.
- Use Web Design Guidelines and Accessibility Review for UI review tasks.
- Use Browser/Playwright Verification after meaningful UI, route, form, or interaction changes.
- Use View Transitions only when product/design explicitly requires route or shared-element motion; do not add it proactively.

## Testing And Git

- Tests live next to code as `*.test.ts(x)`; browser flows live in `e2e/`.
- Use MSW for network mocking.
- Keep lint/format ignores limited to generated output, caches, build artifacts, and lockfiles.
- Lefthook: pre-commit runs typecheck/lint/format/test; pre-push runs `pnpm verify`; commit-msg runs commitlint.
- CI is source of truth: verify, build, E2E.
- Do not revert user changes unless explicitly asked.
