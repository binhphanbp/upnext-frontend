import {
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  FileWarning,
  UsersRound,
} from "@/features/recruiter/icons";
import { type RecruiterJobPostsKpi } from "@/features/recruiter/types";
import { cn } from "@/shared/lib/cn";

const accentClasses = {
  blue: "bg-blue-50 text-blue-500",
  emerald: "bg-emerald-50 text-emerald-500",
  orange: "bg-orange-50 text-orange-500",
  rose: "bg-rose-50 text-rose-500",
  violet: "bg-violet-50 text-violet-500",
} as const;

export function JobKpiGrid({ items }: { items: RecruiterJobPostsKpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = getKpiIcon(item.label);

        return (
          <article
            className="min-h-[122px] rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]"
            key={item.label}
          >
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  accentClasses[item.tone],
                )}
              >
                <Icon aria-hidden className="h-5 w-5 stroke-[1.9]" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl leading-none font-extrabold text-slate-950">
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-5 text-xs font-bold text-slate-500">{item.helper}</p>
          </article>
        );
      })}
    </div>
  );
}

function getKpiIcon(label: string) {
  switch (label) {
    case "Tổng tin":
      return BriefcaseBusiness;
    case "Đang tuyển":
      return UsersRound;
    case "Chờ duyệt":
      return Clock3;
    case "Sắp hết hạn":
      return CalendarClock;
    default:
      return FileWarning;
  }
}
