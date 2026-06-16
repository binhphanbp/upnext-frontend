import {
  effectivenessLabels,
  recruiterJobPosts,
  statusLabels,
  type JobEffectiveness,
  type JobPostStatus,
} from "@/features/recruiter/data/job-posts-data";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "@/features/recruiter/icons";
import { cn } from "@/shared/lib/cn";

const statusClasses: Record<JobPostStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  expiring: "bg-orange-50 text-orange-600",
  needsOptimization: "bg-rose-50 text-rose-600",
  pending: "bg-blue-50 text-blue-600",
};

const effectivenessClasses: Record<JobEffectiveness, string> = {
  good: "bg-emerald-50 text-emerald-700",
  needsOptimization: "bg-rose-50 text-rose-600",
  new: "bg-blue-50 text-blue-600",
  ok: "bg-orange-50 text-orange-600",
};

export function JobPostsTable() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
      <h2 className="text-lg font-extrabold text-slate-950">Danh sách tin tuyển dụng</h2>

      <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500">
              <th className="px-3 py-4">Tin tuyển dụng</th>
              <th className="px-2 py-4 text-center">Trạng thái</th>
              <th className="px-2 py-4 text-center">Lượt xem</th>
              <th className="px-2 py-4 text-center">Hồ sơ</th>
              <th className="px-2 py-4 text-center">Tỷ lệ ứng tuyển</th>
              <th className="px-2 py-4 text-center">Ứng viên mới</th>
              <th className="px-2 py-4 text-center">Còn hạn</th>
              <th className="px-2 py-4 text-center">Hiệu quả</th>
              <th className="px-2 py-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recruiterJobPosts.map((job) => (
              <tr className="text-sm font-bold text-slate-700" key={job.title}>
                <td className="px-3 py-4 font-extrabold whitespace-nowrap text-slate-900">
                  {job.title}
                </td>
                <td className="px-2 py-4 text-center">
                  <span
                    className={cn(
                      "inline-flex h-7 items-center rounded-md px-3 text-xs font-extrabold",
                      statusClasses[job.status],
                    )}
                  >
                    {statusLabels[job.status]}
                  </span>
                </td>
                <td className="px-2 py-4 text-center">{job.views}</td>
                <td className="px-2 py-4 text-center">{job.applications}</td>
                <td className="px-2 py-4 text-center">{job.conversion}</td>
                <td className="px-2 py-4 text-center">{job.newCandidates}</td>
                <td
                  className={cn(
                    "px-2 py-4 text-center",
                    (job.daysLeft === "7 ngày" || job.daysLeft === "2 ngày") && "text-red-500",
                  )}
                >
                  {job.daysLeft}
                </td>
                <td className="px-2 py-4 text-center">
                  <span
                    className={cn(
                      "inline-flex h-7 items-center rounded-md px-3 text-xs font-extrabold",
                      effectivenessClasses[job.effectiveness],
                    )}
                  >
                    {effectivenessLabels[job.effectiveness]}
                  </span>
                </td>
                <td className="px-2 py-4 text-center">
                  <button
                    aria-label={`Thao tác ${job.title}`}
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

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-500">Hiển thị 1–6 / 24 tin</p>
        <div className="flex items-center gap-2">
          <PaginationButton ariaLabel="Trang trước">
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </PaginationButton>
          {["1", "2", "3", "4"].map((page, index) => (
            <button
              className={cn(
                "h-9 w-9 rounded-lg border text-sm font-bold",
                index === 0
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-700",
              )}
              key={page}
            >
              {page}
            </button>
          ))}
          <span className="px-1 text-sm font-bold text-slate-500">...</span>
          <button className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700">
            4
          </button>
          <PaginationButton ariaLabel="Trang sau">
            <ChevronRight aria-hidden className="h-4 w-4" />
          </PaginationButton>
        </div>
      </div>
    </section>
  );
}

function PaginationButton({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700"
    >
      {children}
    </button>
  );
}
