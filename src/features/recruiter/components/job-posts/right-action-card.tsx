import { jobActionItems } from "@/features/recruiter/data/job-posts-data";
import { ArrowRight } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

export function RightActionCard() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <h2 className="text-base font-extrabold text-slate-950">Việc cần xử lý</h2>
      <div className="mt-4 space-y-4">
        {jobActionItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              className="flex items-center gap-3 text-sm font-bold text-slate-700"
              key={item.text}
            >
              <Icon aria-hidden className={cn("h-5 w-5 stroke-[1.9]", item.color)} />
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
      <a
        className="mt-5 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Xem chi tiết
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </section>
  );
}
