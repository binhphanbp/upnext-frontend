"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";

import type { AiApplicationStatusCard } from "../../types";
import { AiCardSection, AiCardShell } from "./card-primitives";

export function ApplicationStatusCard({ card }: { card: AiApplicationStatusCard }) {
  const t = useTranslations("AiCopilot");

  return (
    <AiCardShell>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="min-w-0 flex-1">
          <Link
            href={card.href}
            className="upnext-focus block truncate text-[15px] font-bold text-slate-950 hover:text-emerald-700"
          >
            {card.jobTitle}
          </Link>
          <p className="truncate text-[13px] text-slate-600">{card.companyName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t("application.appliedAt", { date: card.appliedAt })}
          </p>
        </div>
        <Badge tone={card.statusTone}>{card.status}</Badge>
      </div>

      <AiCardSection className="bg-slate-50/60">
        <ol className="flex items-start">
          {card.timeline.map((step, index) => (
            <li key={step.label} className="relative flex min-w-0 flex-1 flex-col items-center">
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[7px] right-1/2 left-0 h-0.5",
                    step.state === "upcoming" ? "bg-slate-200" : "bg-emerald-400",
                  )}
                />
              ) : null}
              {index < card.timeline.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[7px] right-0 left-1/2 h-0.5",
                    card.timeline[index + 1]?.state === "upcoming"
                      ? "bg-slate-200"
                      : "bg-emerald-400",
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 size-4 rounded-full border-2 bg-white",
                  step.state === "done" && "border-emerald-500 bg-emerald-500",
                  step.state === "current" && "border-emerald-500 ring-4 ring-emerald-100",
                  step.state === "upcoming" && "border-slate-300",
                )}
              />
              <span
                className={cn(
                  "mt-1.5 max-w-full truncate text-[11px] font-semibold",
                  step.state === "upcoming" ? "text-slate-400" : "text-slate-700",
                )}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">{step.at}</span>
            </li>
          ))}
        </ol>
      </AiCardSection>

      <AiCardSection className="flex justify-end py-2.5">
        <Link
          href={card.href}
          className="upnext-focus inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800"
        >
          {t("application.open")}
          <ArrowRight className="size-3.5" />
        </Link>
      </AiCardSection>
    </AiCardShell>
  );
}
