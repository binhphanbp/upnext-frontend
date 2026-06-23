# Admin feature workspace

Admin pages should live under `src/features/admin` and use primitives from `src/shared/ui`.

Conventions:

- Put page-level modules in a focused subfolder such as `dashboard`, `roles`, `moderation`, or `finance`.
- Keep route files in `src/app/[locale]/(workspace)/admin/**` thin and delegate UI to feature modules.
- Use `WorkspaceShell` through the Admin layout; do not create another sidebar implementation.
- Use dynamic permission config for role-specific navigation/actions instead of hard-coded Admin variants.
