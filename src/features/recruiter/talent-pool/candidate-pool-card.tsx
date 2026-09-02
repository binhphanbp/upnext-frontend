"use client";

import {
  BookmarkSimple,
  Briefcase,
  Buildings,
  CheckCircle,
  CurrencyDollar,
  MapPin,
  Paperclip,
  User,
} from "@phosphor-icons/react";
import { useState } from "react";

import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

import type { AiSearchResultCard, TalentPoolCard } from "./api";

export type CandidatePoolCardCopy = Readonly<{
  noHeadline: string;
  viewDetail: string;
  viewedBadge: string;
  matchScoreLabel: (score: number) => string;
  activeSeeking: string;
  lastUpdated: (date: string) => string;
  upgradeToViewCompany: string;
  noExperience: string;
  experienceYears: (years: number) => string;
  salaryNegotiable: string;
  hasCvTooltip: string;
  saveCandidate: string;
  savedCandidate: string;
}>;

export type CandidatePoolCardProps = Readonly<{
  card: TalentPoolCard | AiSearchResultCard;
  copy: CandidatePoolCardCopy;
  onViewDetail: (candidateProfileId: string) => void;
  loading?: boolean;
  viewMode?: "list" | "grid";
}>;

export function CandidatePoolCard({
  card,
  copy,
  onViewDetail,
  loading = false,
  viewMode = "list",
}: CandidatePoolCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const matchScore = "matchScore" in card ? card.matchScore : null;

  const formattedDate = card.updatedAt ? formatAppDate(card.updatedAt) : formatAppDate(new Date());

  const hasCv = card.hasCv ?? true;

  if (viewMode === "grid") {
    return (
      <Card className="hover:border-brand/50 flex h-full flex-col justify-between gap-4 p-5 transition-all duration-200 hover:shadow-md">
        <div className="space-y-3">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <CandidateAvatar
                  avatarUrl={card.avatarUrl}
                  fullName={card.fullName}
                  sizeClass="h-12 w-12"
                  iconSize={24}
                />
                {hasCv ? (
                  <span
                    className="bg-brand absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border border-white text-white shadow-xs"
                    title={copy.hasCvTooltip}
                  >
                    <Paperclip size={11} weight="bold" />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onViewDetail(card.candidateProfileId)}
                    className="hover:text-brand truncate text-left text-base font-semibold text-slate-900 transition-colors"
                  >
                    {card.fullName}
                  </button>
                  {card.isOpenToWork ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {copy.activeSeeking}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                  {card.headline ?? copy.noHeadline}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSaved(!isSaved)}
              className={`shrink-0 rounded-lg p-1.5 transition-colors ${
                isSaved
                  ? "text-brand hover:bg-brand-muted"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              title={isSaved ? copy.savedCandidate : copy.saveCandidate}
              aria-label={isSaved ? copy.savedCandidate : copy.saveCandidate}
            >
              <BookmarkSimple size={20} weight={isSaved ? "fill" : "regular"} />
            </button>
          </header>

          <p className="text-xs text-slate-500">{copy.lastUpdated(formattedDate)}</p>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 truncate">
              <Buildings size={14} className="shrink-0 text-slate-400" />
              {card.currentCompany ? (
                <span className="truncate font-medium text-slate-700">{card.currentCompany}</span>
              ) : (
                <span className="truncate text-slate-500">{copy.upgradeToViewCompany}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Briefcase size={14} className="shrink-0 text-slate-400" />
                {card.experienceYears
                  ? copy.experienceYears(card.experienceYears)
                  : copy.noExperience}
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <CurrencyDollar size={14} className="shrink-0 text-slate-400" />
                {card.expectedSalary || copy.salaryNegotiable}
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} className="shrink-0 text-slate-400" />
                {card.city || "Toàn quốc"}
              </span>
            </div>
          </div>

          {card.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {card.skills.slice(0, 5).map((skill) => (
                <li key={skill.id}>
                  <Badge tone="brand" className="text-xs">
                    {skill.name}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-100 pt-3">
          {card.viewedThisPeriod ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle size={14} weight="fill" aria-hidden />
              {copy.viewedBadge}
            </span>
          ) : (
            <span />
          )}
          {matchScore !== null ? (
            <Badge tone="premium" className="text-xs">
              {copy.matchScoreLabel(matchScore)}
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            className="border-brand text-brand hover:bg-brand-muted hover:border-brand"
            disabled={loading}
            onClick={() => onViewDetail(card.candidateProfileId)}
          >
            {copy.viewDetail}
          </Button>
        </footer>
      </Card>
    );
  }

  // List View: Matches the TopCV reference UI card layout perfectly
  return (
    <Card className="group hover:border-brand/40 relative flex flex-col justify-between gap-4 bg-white p-4.5 transition-all duration-200 hover:shadow-md sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 items-start gap-4">
        {/* Left Column: Avatar + Attached CV Icon */}
        <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
          <CandidateAvatar
            avatarUrl={card.avatarUrl}
            fullName={card.fullName}
            sizeClass="h-13 w-13"
            iconSize={28}
          />
          {hasCv ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="hover:text-brand flex h-6 w-6 cursor-help items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100">
                    <Paperclip size={14} weight="regular" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {copy.hasCvTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>

        {/* Center Column: Candidate Information */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Row 1: Name + Active Seeking + MatchScore */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onViewDetail(card.candidateProfileId)}
              className="hover:text-brand text-left text-base font-semibold text-slate-900 transition-colors"
            >
              {card.fullName}
            </button>
            {card.isOpenToWork ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {copy.activeSeeking}
              </span>
            ) : null}
            {matchScore !== null ? (
              <Badge tone="premium" className="text-xs">
                {copy.matchScoreLabel(matchScore)}
              </Badge>
            ) : null}
          </div>

          {/* Row 2: Headline / Role */}
          <p className="truncate text-sm font-medium text-slate-700">
            {card.headline ?? copy.noHeadline}
          </p>

          {/* Row 3: Last updated */}
          <p className="text-xs text-slate-400">{copy.lastUpdated(formattedDate)}</p>

          {/* Row 4: Metadata bar with vertical dividers */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5 text-sm">
            {/* Current company / masked text */}
            <div className="flex items-center gap-1.5 text-slate-600">
              <Buildings size={15} className="shrink-0 text-slate-400" aria-hidden />
              {card.currentCompany ? (
                <span className="font-medium text-slate-800">{card.currentCompany}</span>
              ) : (
                <span className="font-normal text-slate-500">{copy.upgradeToViewCompany}</span>
              )}
            </div>

            <span className="text-slate-300 select-none" aria-hidden>
              |
            </span>

            {/* Experience years */}
            <div className="flex items-center gap-1 text-slate-600">
              <Briefcase size={15} className="shrink-0 text-slate-400" aria-hidden />
              <span>
                {card.experienceYears
                  ? copy.experienceYears(card.experienceYears)
                  : copy.noExperience}
              </span>
            </div>

            <span className="text-slate-300 select-none" aria-hidden>
              |
            </span>

            {/* Salary */}
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <CurrencyDollar size={15} className="shrink-0 text-slate-400" aria-hidden />
              <span>{card.expectedSalary || copy.salaryNegotiable}</span>
            </div>

            <span className="text-slate-300 select-none" aria-hidden>
              |
            </span>

            {/* Location */}
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin size={15} className="shrink-0 text-slate-400" aria-hidden />
              <span>{card.city || "Toàn quốc"}</span>
            </div>
          </div>

          {/* Row 5: Skills */}
          {card.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 pt-1">
              {card.skills.slice(0, 6).map((skill) => (
                <li key={skill.id}>
                  <Badge tone="brand" className="text-xs font-normal">
                    {skill.name}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Right Column: Bookmark + Detail Button */}
      <div className="flex shrink-0 items-center justify-between sm:flex-col sm:items-end sm:justify-between sm:self-stretch sm:pl-4">
        <button
          type="button"
          onClick={() => setIsSaved(!isSaved)}
          className={`rounded-lg p-1.5 transition-colors ${
            isSaved
              ? "text-brand hover:bg-brand-muted"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          }`}
          title={isSaved ? copy.savedCandidate : copy.saveCandidate}
          aria-label={isSaved ? copy.savedCandidate : copy.saveCandidate}
        >
          <BookmarkSimple size={22} weight={isSaved ? "fill" : "regular"} />
        </button>

        <div className="flex items-center gap-2">
          {card.viewedThisPeriod ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle size={14} weight="fill" aria-hidden />
              {copy.viewedBadge}
            </span>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            className="border-brand text-brand hover:bg-brand-muted hover:border-brand rounded-lg px-4 py-1.5 text-sm font-medium"
            disabled={loading}
            onClick={() => onViewDetail(card.candidateProfileId)}
          >
            {copy.viewDetail}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CandidateAvatar({
  avatarUrl,
  fullName,
  sizeClass = "h-13 w-13",
  iconSize = 28,
}: {
  avatarUrl?: string | null | undefined;
  fullName: string;
  sizeClass?: string | undefined;
  iconSize?: number | undefined;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (avatarUrl && !imgFailed) {
    return (
      <div
        className={`relative ${sizeClass} shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-slate-100 shadow-2xs`}
      >
        {/* oxlint-disable-next-line next/no-img-element */}
        <img
          src={avatarUrl}
          alt={fullName}
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-100 text-slate-400 shadow-2xs`}
    >
      <User size={iconSize} weight="regular" />
    </div>
  );
}
