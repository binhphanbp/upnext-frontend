import { jobTabs } from "@/features/recruiter/data/job-posts-data";
import { cn } from "@/shared/lib/cn";

export function JobStatusTabs() {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {jobTabs.map((tab, index) => (
        <button
          className={cn(
            "h-10 rounded-lg border px-5 text-sm font-bold shadow-[0_8px_22px_rgba(15,23,42,0.03)] transition",
            index === 0
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
          )}
          key={tab}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
