# UpNext Frontend

Frontend for UpNext, an IT recruitment platform.

## Tech Stack

- Next.js App Router
- React + TypeScript strict
- Tailwind CSS v4
- TanStack Query for server state
- Zustand for client/UI state
- React Hook Form + Zod
- MSW, Vitest, Playwright
- Oxlint, Oxfmt, Commitlint, Lefthook

`shadcn/ui` and `next-intl` are intentionally not installed yet.

## Requirements

- Node: see `.node-version` / `.nvmrc`
- pnpm: see `packageManager` in `package.json`

This project requires pnpm. Other package managers are blocked by `preinstall`.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Copy `.env.example` when local environment values are needed:

```bash
cp .env.example .env.local
```

## Scripts

```bash
pnpm typecheck      # TypeScript no-emit check
pnpm lint           # Oxlint
pnpm format:check   # Oxfmt check
pnpm format         # Oxfmt write
pnpm test           # Vitest
pnpm test:e2e       # Playwright
pnpm build          # Next production build
pnpm verify         # typecheck + lint + format:check + test
pnpm verify:full    # verify + build + e2e
```

## Project Structure

```txt
src/
  app/                 # Next routes, layouts, metadata, app-level providers
  features/            # domain features, created as real product work starts
    auth/
    jobs/
    companies/
    candidates/
    applications/
    messages/
    notifications/
    employer-dashboard/
    admin/
    search/
  shared/              # reusable non-domain code
    api/
    hooks/
    lib/
    stores/
    types/
    ui/
  mocks/               # MSW setup and handlers
  test/                # test setup utilities
e2e/                   # Playwright tests
```

Feature folders should usually contain only the pieces they need: `api/`, `components/`, `hooks/`, `schemas/`, `types.ts`, and colocated tests.

## Quality Gates

Lefthook runs local checks:

- `pre-commit`: typecheck, lint, format check, unit tests
- `commit-msg`: Conventional Commit validation
- `pre-push`: `pnpm verify`

GitHub Actions runs the full gate on `dev` and `main`: verify, build, and E2E.

## Agent Guidance

Read `AGENTS.md` before changing code. `CLAUDE.md` points Claude to the same canonical guide.
