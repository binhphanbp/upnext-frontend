"use client";

import { ChatCircleText, Circle, CircleHalf, Question } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import type { AiSkillGapCard, AiSkillGapItem } from "../../types";
import { AiCardLabel, AiCardSection, AiCardShell } from "./card-primitives";

const STATUS_ICON = {
  missing: Circle,
  partial: CircleHalf,
  unproven: Question,
} satisfies Record<AiSkillGapItem["status"], typeof Circle>;

const STATUS_TONE: Record<AiSkillGapItem["status"], string> = {
  missing: "text-slate-400",
  partial: "text-blue-500",
  unproven: "text-amber-500",
};

/**
 * Splits *missing* from *unproven* on purpose. A skill the candidate has but did
 * not evidence should cost confidence, not fit (§11.4) — telling them which
 * bucket they are in is the difference between "go learn this" and "go write
 * this down".
 */
export function SkillGapCard({ card }: { card: AiSkillGapCard }) {
  const t = useTranslations("AiCopilot");
  const required = card.gaps.filter((gap) => gap.importance === "required");
  const niceToHave = card.gaps.filter((gap) => gap.importance === "nice_to_have");

  return (
    <AiCardShell>
      <div className="px-4 py-3.5">
        <p className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
          {t("gap.title")}
        </p>
        <p className="mt-0.5 truncate text-[15px] font-bold text-slate-950">{card.jobTitle}</p>
      </div>

      {required.length > 0 ? (
        <AiCardSection>
          <AiCardLabel>{t("gap.required")}</AiCardLabel>
          <ul className="space-y-2.5">
            {required.map((gap) => (
              <GapRow key={gap.skill} gap={gap} statusLabel={t(`gap.status.${gap.status}`)} />
            ))}
          </ul>
        </AiCardSection>
      ) : null}

      {niceToHave.length > 0 ? (
        <AiCardSection>
          <AiCardLabel>{t("gap.niceToHave")}</AiCardLabel>
          <ul className="space-y-2.5">
            {niceToHave.map((gap) => (
              <GapRow key={gap.skill} gap={gap} statusLabel={t(`gap.status.${gap.status}`)} />
            ))}
          </ul>
        </AiCardSection>
      ) : null}

      {card.preparationQuestions.length > 0 ? (
        <AiCardSection className="bg-slate-50/60">
          <AiCardLabel>
            <span className="inline-flex items-center gap-1.5">
              <ChatCircleText weight="fill" className="size-3.5 text-slate-400" />
              {t("gap.prepare")}
            </span>
          </AiCardLabel>
          <ul className="space-y-1.5">
            {card.preparationQuestions.map((question, index) => (
              <li key={question} className="flex gap-2 text-[13px] leading-relaxed text-slate-600">
                <span aria-hidden className="shrink-0 font-mono text-xs text-slate-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </AiCardSection>
      ) : null}
    </AiCardShell>
  );
}

function GapRow({ gap, statusLabel }: { gap: AiSkillGapItem; statusLabel: string }) {
  const Icon = STATUS_ICON[gap.status];
  return (
    <li className="flex items-start gap-2.5">
      <Icon weight="fill" className={cn("mt-0.5 size-4 shrink-0", STATUS_TONE[gap.status])} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13.5px] font-semibold text-slate-800">{gap.skill}</span>
          <span
            className={cn(
              "rounded px-1.5 py-px text-[10px] font-bold tracking-wide uppercase",
              gap.status === "missing" && "bg-slate-100 text-slate-500",
              gap.status === "partial" && "bg-blue-50 text-blue-700",
              gap.status === "unproven" && "bg-amber-50 text-amber-700",
            )}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{gap.note}</p>
      </div>
    </li>
  );
}
