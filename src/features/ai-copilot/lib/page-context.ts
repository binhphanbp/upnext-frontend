import type { AiPageContext } from "../types";

/**
 * §8.3 — the Copilot reads the route so the user never has to re-state what they
 * are looking at. `pathname` comes from `@/i18n/navigation`, so the locale
 * segment is already stripped.
 */
const ROUTES: { pattern: RegExp; type: AiPageContext["type"]; labelKey: string }[] = [
  { pattern: /^\/candidate\/cv-builder/, type: "CV", labelKey: "context.cvBuilder" },
  { pattern: /^\/candidate\/cvs\/([^/]+)/, type: "CV", labelKey: "context.cv" },
  {
    pattern: /^\/candidate\/applications\/([^/]+)/,
    type: "APPLICATION",
    labelKey: "context.application",
  },
  { pattern: /^\/candidate\/applications/, type: "APPLICATION", labelKey: "context.applications" },
  {
    pattern: /^\/candidate\/mock-interviews\/([^/]+)/,
    type: "MOCK_INTERVIEW",
    labelKey: "context.interview",
  },
  { pattern: /^\/candidate\/saved-jobs/, type: "JOB", labelKey: "context.savedJobs" },
  { pattern: /^\/jobs\/([^/]+)/, type: "JOB", labelKey: "context.job" },
];

export function resolvePageContext(pathname: string): AiPageContext {
  for (const route of ROUTES) {
    const match = route.pattern.exec(pathname);
    if (!match) continue;
    const id = match[1];
    return { type: route.type, labelKey: route.labelKey, ...(id === undefined ? {} : { id }) };
  }
  return { type: "GENERAL", labelKey: "context.general" };
}
