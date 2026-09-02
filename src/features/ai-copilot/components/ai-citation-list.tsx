"use client";

import { ArrowSquareOut, Quotes } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

import type { AiCitation } from "../types";

const SOURCE_TONE: Record<AiCitation["sourceType"], string> = {
  CV: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  JOB: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  APPLICATION: "bg-blue-50 text-blue-700 ring-blue-100",
  PROFILE: "bg-slate-100 text-slate-700 ring-slate-200",
  POLICY: "bg-amber-50 text-amber-700 ring-amber-100",
  INTERVIEW: "bg-violet-50 text-violet-700 ring-violet-100",
};

/**
 * Resolves the `[n]` markers in the answer. Grounding is the product claim
 * (§1.3), so sources are shown by default rather than hidden behind a toggle —
 * a reviewer should be able to check a statement without extra clicks.
 */
export function AiCitationList({
  citations,
  highlightedId,
}: {
  citations: AiCitation[];
  highlightedId?: string | null;
}) {
  const t = useTranslations("AiCopilot");

  if (citations.length === 0) return null;

  return (
    <section aria-label={t("citations.title")} className="mt-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
        <Quotes weight="fill" className="size-3.5" />
        {t("citations.title")}
      </h4>
      <ul className="space-y-1.5">
        {citations.map((citation) => (
          <li key={citation.id}>
            <div
              id={`citation-${citation.id}`}
              className={cn(
                "rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-all duration-300",
                highlightedId === citation.id &&
                  "border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-100",
              )}
            >
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-px grid size-5 shrink-0 place-items-center rounded-md bg-emerald-100 text-[11px] font-bold text-emerald-800"
                >
                  {citation.index}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset",
                        SOURCE_TONE[citation.sourceType],
                      )}
                    >
                      {t(`citations.source.${citation.sourceType}`)}
                    </span>
                    <span className="min-w-0 truncate text-[13px] font-semibold text-slate-800">
                      {citation.title}
                    </span>
                    {citation.sourceVersion ? (
                      <span className="text-[11px] font-medium text-slate-500">
                        {t("citations.version", { version: citation.sourceVersion })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 border-l-2 border-slate-200 pl-2.5 text-[13px] leading-relaxed text-slate-600 italic">
                    {citation.excerpt}
                  </p>
                </div>
                {citation.href ? (
                  <Link
                    href={citation.href}
                    className="upnext-focus mt-px grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label={t("citations.open", { title: citation.title })}
                  >
                    <ArrowSquareOut className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
