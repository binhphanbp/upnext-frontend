# Recruiter feature workspace

Recruiter pages should live under `src/features/recruiter` and use primitives from `src/shared/ui`.

Conventions:

- Put page-level modules in focused subfolders such as `dashboard`, `job-posts`, `candidates`, `pipeline`, or `billing`.
- Keep route files in `src/app/[locale]/(workspace)/recruiter/**` thin and delegate UI to feature modules.
- Use `WorkspaceShell` through the Recruiter layout; do not create another sidebar implementation.
- Prefer shadcn-style primitives for forms, dialogs, tabs, filters, tables, drawers, and dropdown menus.
