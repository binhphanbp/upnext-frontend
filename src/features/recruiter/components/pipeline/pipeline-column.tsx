import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";

import type { PipelineCandidate } from "@/features/recruiter/api/pipeline";
import { cn } from "@/shared/lib/cn";

import { SortableCandidateCard } from "./candidate-card";
import type { PipelineStage } from "./pipeline-mock-data";

type PipelineColumnProps = Readonly<{
  stage: PipelineStage;
  candidates: PipelineCandidate[];
}>;

export function PipelineColumn({ stage, candidates }: PipelineColumnProps) {
  const t = useTranslations("Recruiter");
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex max-h-[calc(100vh-280px)] w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border transition-colors bg-slate-50/70",
        isOver ? "border-emerald-500/30 bg-emerald-50/15" : "border-slate-100",
      )}
    >
      {/* Sticky Header */}
      <div
        className={cn(
          "shrink-0 rounded-t-xl border-b border-slate-150 p-4 transition-colors",
          isOver ? "bg-emerald-50/30" : "bg-white",
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-800">
            {stage.title}
          </h3>
          <span className="flex size-5 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
            {candidates.length}
          </span>
        </div>
        {stage.description && (
          <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
            {stage.description}
          </p>
        )}
      </div>

      {/* Candidates List Container */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 select-none">
        <SortableContext items={candidates.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {candidates.length > 0 ? (
            candidates.map((candidate) => (
              <SortableCandidateCard key={candidate.id} candidate={candidate} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/40 px-4 py-10 text-center">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                {t("pipeline.column.noCandidates")}
              </span>
              <p className="mt-1 text-[10px] text-slate-400">
                {t("pipeline.column.emptyDescription")}
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
