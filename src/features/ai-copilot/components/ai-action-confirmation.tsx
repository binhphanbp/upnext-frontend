"use client";

import { ArrowRight, CheckCircle, ShieldCheck, SpinnerGap, XCircle } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

import type { AiActionRequest } from "../types";

/**
 * §1.3 / §6.2 — nothing the Copilot proposes is written until a human presses
 * confirm, and the panel spells out every field that would change before they
 * do. The write itself is executed by NestJS, never by the AI service (§16.3).
 */
export function AiActionConfirmation({
  actionRequest,
  isPending,
  onResolve,
}: {
  actionRequest: AiActionRequest;
  isPending: boolean;
  onResolve: (decision: "CONFIRMED" | "REJECTED") => void;
}) {
  const t = useTranslations("AiCopilot");
  const isSettled = actionRequest.status !== "PENDING";

  if (isSettled) {
    const isExecuted = actionRequest.status === "EXECUTED";
    return (
      // `<output>` carries an implicit live region, so the outcome is announced
      // without an extra `role`.
      <output
        className={
          isExecuted
            ? "mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5"
            : "mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5"
        }
      >
        {isExecuted ? (
          <CheckCircle weight="fill" className="size-4 shrink-0 text-emerald-600" />
        ) : (
          <XCircle weight="fill" className="size-4 shrink-0 text-slate-400" />
        )}
        <p
          className={
            isExecuted
              ? "text-[13px] font-semibold text-emerald-800"
              : "text-[13px] font-semibold text-slate-600"
          }
        >
          {isExecuted
            ? t("action.executed", { title: actionRequest.title })
            : t("action.rejected", { title: actionRequest.title })}
        </p>
      </output>
    );
  }

  return (
    <section
      aria-label={t("action.title")}
      className="mt-3 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-indigo-50/40"
    >
      <header className="flex items-start gap-2.5 px-4 pt-3.5 pb-2">
        <ShieldCheck weight="fill" className="mt-px size-5 shrink-0 text-indigo-500" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.08em] text-indigo-500 uppercase">
            {t("action.title")}
          </p>
          <h4 className="mt-0.5 text-[15px] font-bold text-slate-950">{actionRequest.title}</h4>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
            {actionRequest.description}
          </p>
        </div>
      </header>

      <dl className="mx-4 mb-3 divide-y divide-indigo-100 rounded-xl border border-indigo-100 bg-white">
        {actionRequest.changes.map((change) => (
          <div key={change.label} className="px-3 py-2.5">
            <dt className="text-[11px] font-bold tracking-[0.06em] text-slate-400 uppercase">
              {change.label}
            </dt>
            <dd className="mt-1 flex items-start gap-2 text-[13px] leading-relaxed">
              {change.from ? (
                <>
                  <span className="text-slate-400 line-through">{change.from}</span>
                  <ArrowRight aria-hidden className="mt-1 size-3.5 shrink-0 text-slate-300" />
                </>
              ) : null}
              <span className="font-medium text-slate-800">{change.to}</span>
            </dd>
          </div>
        ))}
      </dl>

      <footer className="flex flex-wrap items-center gap-2 border-t border-indigo-100 bg-white/70 px-4 py-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => onResolve("CONFIRMED")}
        >
          {isPending ? <SpinnerGap className="animate-spin" /> : <CheckCircle weight="fill" />}
          {actionRequest.confirmLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => onResolve("REJECTED")}
        >
          {t("action.reject")}
        </Button>
        <p className="ml-auto text-[11px] text-slate-400">{t("action.note")}</p>
      </footer>
    </section>
  );
}
