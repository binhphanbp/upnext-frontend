"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SealCheck, Calendar, MapPin, DotsSixVertical } from "@phosphor-icons/react";
import { useLocale, useTranslations } from "next-intl";

import type { PipelineCandidate } from "@/features/recruiter/api/pipeline";
import { formatRelativeTime } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";

type CandidateCardProps = Readonly<{
  candidate: PipelineCandidate;
  dragHandle?: React.ReactNode;
}>;

export function CandidateCard({ candidate, dragHandle }: CandidateCardProps) {
  const locale = useLocale();
  const t = useTranslations("Recruiter");

  const initials = candidate.name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const timeStr = formatRelativeTime(candidate.lastUpdatedAt, locale as any);

  return (
    <div className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md">
      {dragHandle}
      {/* Header: Avatar/Initials & Name/Role */}
      <div className="flex items-start gap-3 pr-6">
        {candidate.avatarUrl ? (
          <img
            src={candidate.avatarUrl}
            alt={candidate.name}
            className="size-10 rounded-full border border-slate-100 object-cover"
          />
        ) : (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-emerald-700">
            {candidate.name}
          </h4>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{candidate.role}</p>
        </div>
      </div>

      {/* Meta: Location & Experience */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
        {candidate.location && (
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-slate-400" />
            <span>{candidate.location}</span>
          </div>
        )}
        {candidate.experienceYears !== null && candidate.experienceYears !== undefined && (
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-slate-400" />
            <span>{t("pipeline.column.yrsExp", { count: candidate.experienceYears })}</span>
          </div>
        )}
      </div>

      {/* Tech Stack Badges */}
      <div className="mt-3 flex flex-wrap gap-1">
        {candidate.techStack.map((tech) => (
          <Badge key={tech} tone="brand" className="px-2 py-0.5 text-[10px] font-medium">
            {tech}
          </Badge>
        ))}
      </div>

      {/* Scores (e.g. tests) */}
      {candidate.scores && candidate.scores.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
          {candidate.scores.map((score) => (
            <div
              key={score.label}
              className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/50 px-2 py-1 text-xs"
            >
              <span className="flex max-w-[70%] items-center gap-1 truncate font-medium text-slate-500">
                <SealCheck size={14} className="shrink-0 text-amber-500" />
                {score.label}
              </span>
              <span className="font-semibold text-slate-700">
                {score.value}/{score.maxValue}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Interview */}
      {candidate.interview && (
        <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            {locale === "vi" ? "Lịch phỏng vấn" : "Upcoming Interview"}
          </div>
          <div className="mt-1 flex flex-col gap-0.5 rounded-md border border-emerald-100/50 bg-emerald-50/50 p-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-emerald-800">
                {new Date(candidate.interview.scheduledAt).toLocaleString(
                  locale === "vi" ? "vi-VN" : "en-US",
                  {
                    dateStyle: "short",
                    timeStyle: "short",
                  },
                )}
              </span>
              <span className="shrink-0 rounded bg-emerald-100/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                {candidate.interview.mode}
              </span>
            </div>
            {candidate.interview.interviewerName && (
              <span className="text-[10px] font-medium text-slate-500">
                {locale === "vi" ? `Người phỏng vấn: ` : `Interviewer: `}
                <strong>{candidate.interview.interviewerName}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: Last Updated Time */}
      <div className="mt-3 flex items-center justify-end text-[10px] font-medium text-slate-400">
        <span>{timeStr}</span>
      </div>
    </div>
  );
}

export function SortableCandidateCard({ candidate }: { candidate: PipelineCandidate }) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: candidate.id,
  });

  const style = {
    opacity: isDragging ? 0.35 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab outline-none active:cursor-grabbing"
    >
      <CandidateCard
        candidate={candidate}
        dragHandle={
          <div
            className="absolute top-4 right-4 z-10 text-slate-300 transition-colors group-hover:text-slate-500"
            aria-hidden="true"
          >
            <DotsSixVertical size={18} />
          </div>
        }
      />
    </div>
  );
}
