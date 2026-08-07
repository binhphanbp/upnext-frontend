"use client";

import {
  ArrowRight,
  Buildings,
  CaretDown,
  CheckCircle,
  Circle,
  Question,
} from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

import type { AiJobMatchCard } from "../../types";
import {
  AiCardLabel,
  AiCardSection,
  AiCardShell,
  ConfidenceMeter,
  ScoreBar,
  ScoreRing,
  SkillChip,
} from "./card-primitives";

/**
 * §8.2 — the explainable match. The breakdown is one click away rather than
 * hidden, because "84%" without the weights behind it is exactly the black box
 * the plan rules out (§11.1).
 */
export function JobMatchCard({ card }: { card: AiJobMatchCard }) {
  const t = useTranslations("AiCopilot");
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  return (
    <AiCardShell>
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400">
          <Buildings weight="fill" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={card.href}
            className="upnext-focus block truncate text-[15px] font-bold text-slate-950 hover:text-emerald-700"
          >
            {card.title}
          </Link>
          <p className="truncate text-[13px] text-slate-600">{card.companyName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span>{card.location}</span>
            <span aria-hidden className="text-slate-300">
              ·
            </span>
            <span>{card.workingModel}</span>
            {card.salaryLabel ? (
              <>
                <span aria-hidden className="text-slate-300">
                  ·
                </span>
                <span className="font-semibold text-emerald-700">{card.salaryLabel}</span>
              </>
            ) : null}
          </div>
        </div>
        <ScoreRing score={card.totalScore} label={t("match.fit")} />
      </div>

      <AiCardSection className="bg-slate-50/60">
        <ConfidenceMeter
          value={card.confidenceScore}
          label={t("match.confidence")}
          {...(card.confidenceReason === undefined ? {} : { reason: card.confidenceReason })}
        />
      </AiCardSection>

      <AiCardSection className="p-0">
        <button
          type="button"
          onClick={() => setIsBreakdownOpen((current) => !current)}
          aria-expanded={isBreakdownOpen}
          className="upnext-focus flex w-full items-center gap-2 px-4 py-2.5 text-left"
        >
          <span className="flex-1 text-[13px] font-semibold text-slate-700">
            {t("match.breakdownTitle")}
          </span>
          <code className="font-mono text-[11px] text-slate-400">{card.algorithmVersion}</code>
          <CaretDown
            aria-hidden
            className={cn(
              "size-3.5 text-slate-400 transition-transform",
              isBreakdownOpen && "rotate-180",
            )}
          />
        </button>

        {isBreakdownOpen ? (
          <ul className="space-y-2.5 border-t border-slate-100 px-4 py-3">
            {card.breakdown.map((item) => (
              <li key={item.key}>
                <div className="flex items-baseline gap-2">
                  <span className="flex-1 truncate text-[13px] text-slate-600">{item.label}</span>
                  <span className="shrink-0 rounded bg-slate-100 px-1.5 py-px font-mono text-[10px] font-semibold text-slate-500">
                    {Math.round(item.weight * 100)}%
                  </span>
                  <span
                    className={cn(
                      "w-11 shrink-0 text-right text-[13px] font-bold tabular-nums",
                      item.unknown ? "text-slate-400" : "text-slate-800",
                    )}
                  >
                    {item.unknown ? t("match.unknown") : item.score}
                  </span>
                </div>
                <ScoreBar score={item.score} unknown={item.unknown ?? false} className="mt-1" />
              </li>
            ))}
          </ul>
        ) : null}
      </AiCardSection>

      <AiCardSection>
        <SkillGroup
          icon={<CheckCircle weight="fill" className="size-3.5 text-emerald-500" />}
          label={t("match.matched")}
          items={card.matchedSkills}
          tone="matched"
        />
        {card.missingSkills.length > 0 ? (
          <div className="mt-3">
            <SkillGroup
              icon={<Circle className="size-3.5 text-slate-400" />}
              label={t("match.missing")}
              items={card.missingSkills}
              tone="missing"
            />
          </div>
        ) : null}
        {card.toVerify.length > 0 ? (
          <div className="mt-3">
            <SkillGroup
              icon={<Question weight="bold" className="size-3.5 text-amber-500" />}
              label={t("match.toVerify")}
              items={card.toVerify}
              tone="verify"
            />
          </div>
        ) : null}
      </AiCardSection>

      <AiCardSection className="flex items-center justify-between gap-3 bg-slate-50/60 py-2.5">
        <p className="text-[11px] text-slate-400">{t("match.disclaimer")}</p>
        <Link
          href={card.href}
          className="upnext-focus inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800"
        >
          {t("match.viewJob")}
          <ArrowRight className="size-3.5" />
        </Link>
      </AiCardSection>
    </AiCardShell>
  );
}

function SkillGroup({
  icon,
  label,
  items,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  tone: "matched" | "missing" | "verify";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <AiCardLabel>
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </AiCardLabel>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <SkillChip key={item} tone={tone}>
            {item}
          </SkillChip>
        ))}
      </div>
    </div>
  );
}
