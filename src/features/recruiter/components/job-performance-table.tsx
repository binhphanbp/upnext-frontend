import { jobRows, statusLabels, type JobStatus } from "@/features/recruiter/data/dashboard-data";
import { ArrowRight, MoreHorizontal } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

import { SectionCard } from "./section-card";

const statusClasses: Record<JobStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-orange-50 text-orange-600",
  needsOptimization: "bg-rose-50 text-rose-600",
};

export function JobPerformanceTable() {
  return (
    <SectionCard className="p-4">
      <h2 className="mb-4 text-base font-extrabold text-slate-950">Hiệu quả tin tuyển dụng</h2>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-left text-xs font-bold text-slate-500">
              <th className="px-3 py-4">Tin tuyển dụng</th>
              <th className="px-3 py-4 text-center">Lượt xem</th>
              <th className="px-3 py-4 text-center">Hồ sơ</th>
              <th className="px-3 py-4 text-center">Tỷ lệ ứng tuyển</th>
              <th className="px-3 py-4 text-center">Trạng thái</th>
              <th className="px-3 py-4 text-center">Còn hạn</th>
              <th className="px-3 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobRows.map((row) => (
              <tr className="text-xs font-bold text-slate-700" key={row.title}>
                <td className="px-3 py-3.5 font-extrabold text-slate-800">{row.title}</td>
                <td className="px-3 py-3.5 text-center">{row.views}</td>
                <td className="px-3 py-3.5 text-center">{row.applications}</td>
                <td className="px-3 py-3.5 text-center">{row.conversion}</td>
                <td className="px-3 py-3.5 text-center">
                  <span
                    className={cn(
                      "inline-flex h-7 items-center rounded-md px-3 text-xs font-extrabold",
                      statusClasses[row.status],
                    )}
                  >
                    {statusLabels[row.status]}
                  </span>
                </td>
                <td
                  className={cn(
                    "px-3 py-3.5 text-center",
                    row.daysLeft === "7 ngày" && "text-red-500",
                    row.daysLeft === "2 ngày" && "text-red-500",
                  )}
                >
                  {row.daysLeft}
                </td>
                <td className="px-3 py-3.5 text-center">
                  <button
                    aria-label={`Thao tác ${row.title}`}
                    className="inline-flex h-8 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600"
                  >
                    <MoreHorizontal aria-hidden className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        className="mt-6 inline-flex items-center gap-3 text-sm font-extrabold text-emerald-600"
        href="#"
      >
        Xem tất cả tin tuyển dụng
        <ArrowRight aria-hidden className="h-4 w-4" />
      </a>
    </SectionCard>
  );
}
