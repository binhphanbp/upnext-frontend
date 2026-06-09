# UpNext Frontend Agent Guide

Keep this file short. Follow these rules before changing code.

## Project

- Frontend for UpNext, an IT recruitment platform.
- Stack: Next.js App Router, React, TypeScript strict, Tailwind CSS v4, next-intl, TanStack Query, TanStack Table, React Hook Form, Zod, Zustand, date-fns, Phosphor Icons, shadcn/ui, MSW, Vitest, Playwright, Oxlint, Oxfmt.
- Lucide is not installed. Do not assume it exists.
- Package manager is pnpm only. Use Node and pnpm versions from `.node-version`, `.nvmrc`, and `package.json`.

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Format check: `pnpm format:check`
- Format write: `pnpm format`
- Unit tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- Standard verification: `pnpm verify`
- Full verification: `pnpm verify:full`

Run `pnpm verify` before handing off normal changes. Run `pnpm verify:full` when routes, app shell, provider setup, or E2E behavior changes.

## Architecture

- Use Feature-First Hybrid:
  - `src/app/[locale]`: localized routes, layouts, metadata, app-level composition only.
  - `src/app`: global styles and app-level providers.
  - `src/features/<domain>`: domain UI, hooks, schemas, API calls, types, and tests.
  - `src/shared`: reusable non-domain code such as `api`, `lib`, `ui`, hooks, stores, and types.
  - `src/shared/ui`: shared UpNext UI primitives, including selectively generated shadcn/ui components.
  - `src/i18n`: next-intl routing, request config, and navigation helpers.
  - `messages`: next-intl message catalogs.
  - `src/mocks`: MSW handlers/setup.
  - `src/test`: test setup utilities.
- Add a feature folder only when real domain code exists. Expected domains: `auth`, `jobs`, `companies`, `candidates`, `applications`, `messages`, `notifications`, `employer-dashboard`, `admin`, `search`.
- Avoid business logic in `src/app`. App routes should compose feature/shared modules.
- Prefer this feature shape when needed: `api/`, `components/`, `hooks/`, `schemas/`, `types.ts`, and colocated `*.test.ts(x)`.
- Use `@/*` imports for source paths.

## Coding Rules

- Keep TypeScript strict. Do not loosen `tsconfig.json`.
- Prefer Server Components by default. Add `"use client"` only for state, effects, browser APIs, event handlers, or client-only libraries.
- Use TanStack Query for server state and API caching. Do not store API data in Zustand.
- Use Zustand only for client/UI state, not API data.
- Use React Hook Form with Zod for forms and validation.
- Use next-intl for UI messages and locale routing. Do not hardcode user-facing strings in reusable/product UI when a translation key is expected.
- Use `motion/react` for animation imports.
- Use icons from `@phosphor-icons/react`.
- Use Tailwind CSS v4 utilities and `cn()` from `src/shared/lib/cn.ts` for class merging.
- Use `src/shared/lib/date.ts` for app date formatting with date-fns.
- Use `src/shared/ui/data-table` as the TanStack Table baseline before adding domain-specific table behavior.
- Treat Figma/product design as the UI source of truth. shadcn/ui is a source-code starter for accessible primitives, not the design system.
- Do not add shadcn/ui components proactively. Add them only for design-backed needs such as `Dialog`, `Popover`, `DropdownMenu`, `Select`, `Command`, `Tooltip`, or other interaction-heavy primitives.
- Generated shadcn/ui files must live under `src/shared/ui`, be reviewed as project-owned code, use `cn()`, and be restyled to match UpNext before use.
- Keep shared components generic. Domain-specific UI belongs in `src/features/<domain>`.
- Do not edit generated files such as `public/mockServiceWorker.js`.
- Never expose secrets to the client. Public env vars must start with `NEXT_PUBLIC_`.
- Read env through `src/shared/lib/env.ts`; add new env keys there with Zod validation.
- Keep API URL creation and fetch behavior in `src/shared/api`; feature code should wrap it with domain-specific query/mutation hooks.

## Testing And Quality

- Place unit/component tests next to the code they cover using `*.test.ts` or `*.test.tsx`.
- Use MSW for network mocking in tests.
- Put browser flow tests under `e2e/`.
- Keep Oxlint/Oxfmt ignores focused on generated output, caches, build artifacts, and lockfiles.
- Lefthook runs fast local gates:
  - `pre-commit`: `typecheck`, `lint`, `format:check`, `test`.
  - `pre-push`: `pnpm verify`.
  - `commit-msg`: Conventional Commit validation.
- CI is the full source of truth and runs `verify`, `build`, and `test:e2e`.
- New domain behavior should include focused tests unless it is purely presentational.

## Git Safety

- Do not revert user changes unless explicitly asked.
- Keep changes scoped to the requested task.
- Do not introduce new libraries without a clear reason and package.json update.
