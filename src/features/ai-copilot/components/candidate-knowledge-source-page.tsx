"use client";

import { ArrowLeft, BookOpen, CalendarBlank, WarningCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";

import {
  getCandidateKnowledgeSource,
  type CandidateKnowledgeSource,
} from "../api/conversations-api";

type SourceState =
  | { status: "loading" }
  | { status: "ready"; source: CandidateKnowledgeSource }
  | { status: "unavailable" };

function displayDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

/**
 * A citation destination, intentionally separate from the chat transcript.
 * It exposes only a reviewed, published source body returned by the candidate
 * API; no prompt, retrieval trace, private profile data, or arbitrary URL is
 * ever rendered here.
 */
export function CandidateKnowledgeSourcePage({ documentId }: { documentId: string }) {
  const t = useTranslations("AiCopilot.knowledgeSource");
  const [state, setState] = useState<SourceState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const source = await getCandidateKnowledgeSource(documentId);
      setState({ status: "ready", source });
    } catch {
      setState({ status: "unavailable" });
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const back = (
    <Link
      href="/candidate/ai"
      className="upnext-focus inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
    >
      <ArrowLeft className="size-4" />
      {t("back")}
    </Link>
  );

  if (state.status === "loading") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {back}
        <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-4 w-36 rounded bg-slate-100" />
          <div className="mt-4 h-8 w-3/4 rounded bg-slate-100" />
          <div className="mt-8 space-y-3">
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 rounded bg-slate-100" />
            <div className="h-4 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      </section>
    );
  }

  if (state.status === "unavailable") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {back}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <WarningCircle className="size-6" weight="fill" />
          <h1 className="mt-3 text-lg font-bold">{t("unavailableTitle")}</h1>
          <p className="mt-1 text-sm leading-6 text-amber-900">{t("unavailableDetail")}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="upnext-focus mt-4 rounded-lg bg-amber-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-950"
          >
            {t("retry")}
          </button>
        </div>
      </section>
    );
  }

  const { source } = state;
  const locale = source.locale.toLowerCase().startsWith("en") ? "en" : "vi";

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {back}
      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 bg-linear-to-br from-emerald-50 to-white px-5 py-6 sm:px-8">
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] text-emerald-700 uppercase">
            <BookOpen className="size-4" weight="fill" />
            {t("badge")}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {source.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
            <span>{t("version", { version: source.sourceVersion })}</span>
            {source.effectiveAt ? (
              <span className="inline-flex items-center gap-1">
                <CalendarBlank className="size-3.5" />
                {t("effective", { date: displayDate(source.effectiveAt, locale) })}
              </span>
            ) : null}
            {source.reviewAt ? (
              <span>{t("review", { date: displayDate(source.reviewAt, locale) })}</span>
            ) : null}
          </div>
        </header>
        <div className="space-y-5 px-5 py-6 text-[15px] leading-7 text-slate-700 sm:px-8">
          {source.content.split(/\n\s*\n/u).map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </section>
  );
}
