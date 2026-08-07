"use client";

import { Flask } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useId } from "react";

import type { MockScenarioKey } from "../api/mock-scenarios";

/**
 * Demo affordance, not a product feature.
 *
 * §15.4 requires the interface to express eleven run states and §30 asks for
 * screenshots of each. Reproducing a rate limit or a blocked tool by hand is
 * awkward, so this replays a chosen scenario on demand.
 *
 * Delete this component (and its two call sites) once the real AI service can
 * produce these states — it is scaffolding for the report, nothing else.
 */
const PREVIEWABLE: MockScenarioKey[] = [
  "guardrail",
  "partial",
  "rate_limited",
  "model_unavailable",
  "cv_analysis",
  "job_search",
  "skill_gap",
  "application_status",
  "mock_interview",
];

export function AiStatePreview({
  onPreview,
  isDisabled,
}: {
  onPreview: (scenario: MockScenarioKey) => void;
  isDisabled: boolean;
}) {
  const t = useTranslations("AiCopilot");
  const selectId = useId();

  return (
    <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
      <label
        htmlFor={selectId}
        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase ring-1 ring-amber-200 ring-inset"
      >
        <Flask weight="fill" className="size-3" />
        {t("statePreview.badge")}
      </label>
      <select
        id={selectId}
        value=""
        disabled={isDisabled}
        onChange={(event) => {
          const scenario = event.target.value as MockScenarioKey | "";
          if (scenario) onPreview(scenario);
          event.target.value = "";
        }}
        aria-label={t("statePreview.label")}
        className="upnext-focus max-w-40 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{t("statePreview.placeholder")}</option>
        {PREVIEWABLE.map((scenario) => (
          <option key={scenario} value={scenario}>
            {t(`statePreview.scenario.${scenario}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
