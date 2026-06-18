import type { DashboardPipelineStage } from "@/features/recruiter/data/dashboard-metrics";

import { SectionCard } from "./section-card";

export function PipelineProgress({
  stages,
  title,
}: {
  stages: DashboardPipelineStage[];
  title: string;
}) {
  return (
    <SectionCard className="p-4">
      <h2 className="mb-5 text-base font-extrabold text-slate-950">{title}</h2>
      <div className="space-y-5">
        {stages.map((stage) => (
          <div className="grid grid-cols-[66px_42px_1fr_38px] items-center gap-2" key={stage.label}>
            <span className="text-xs font-bold text-slate-700">{stage.label}</span>
            <span className="text-right text-xs font-bold text-slate-600">{stage.value}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${stage.color}`}
                style={{ width: `${stage.percent}%` }}
              />
            </div>
            <span className="text-right text-xs font-bold text-slate-600">{stage.percent}%</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
