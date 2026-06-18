import { type RecruiterJobPost, type RecruiterJobPostTab } from "@/features/recruiter/types";
import { cn } from "@/shared/lib/cn";

const tabs: Array<{ label: string; value: RecruiterJobPostTab }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang tuyển", value: "active" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Sắp hết hạn", value: "expiring" },
  { label: "Hết hạn", value: "expired" },
  { label: "Nháp", value: "draft" },
  { label: "Bị khóa", value: "locked" },
];

export function JobStatusTabs({
  activeTab,
  items,
  onChange,
}: {
  activeTab: RecruiterJobPostTab;
  items: RecruiterJobPost[];
  onChange: (tab: RecruiterJobPostTab) => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const count =
          tab.value === "all"
            ? items.length
            : items.filter((item) => item.status === tab.value).length;

        return (
          <button
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-bold shadow-[0_8px_22px_rgba(15,23,42,0.03)] transition",
              activeTab === tab.value
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
            key={tab.value}
            onClick={() => onChange(tab.value)}
            type="button"
          >
            <span>{tab.label}</span>
            <span className="rounded-md bg-white/80 px-2 py-0.5 text-xs">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
