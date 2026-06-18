import { CaretDown } from "@phosphor-icons/react/dist/ssr";

import { ListFilter, Search } from "@/features/recruiter/icons";
import { type RecruiterJobPostStatus } from "@/features/recruiter/types";

export function JobFilters({
  effectiveness,
  location,
  onClear,
  onEffectivenessChange,
  onLocationChange,
  onSearchChange,
  onStatusChange,
  search,
  status,
}: {
  effectiveness: "ALL" | "good" | "needsOptimization" | "new" | "ok";
  location: string;
  onClear: () => void;
  onEffectivenessChange: (value: "ALL" | "good" | "needsOptimization" | "new" | "ok") => void;
  onLocationChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: "ALL" | RecruiterJobPostStatus) => void;
  search: string;
  status: "ALL" | RecruiterJobPostStatus;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(320px,1fr)_auto_220px_auto_auto] xl:items-center">
        <label className="relative block">
          <span className="sr-only">Tìm theo tên vị trí</span>
          <input
            aria-label="Tìm theo tên vị trí"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-11 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên vị trí"
            type="search"
            value={search}
          />
          <Search
            aria-hidden
            className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400"
          />
        </label>

        <SelectField
          ariaLabel="Trạng thái"
          fieldId="job-filter-status"
          onChange={(value) => onStatusChange(value as "ALL" | RecruiterJobPostStatus)}
          options={[
            { label: "Trạng thái", value: "ALL" },
            { label: "Đang tuyển", value: "active" },
            { label: "Chờ duyệt", value: "pending" },
            { label: "Sắp hết hạn", value: "expiring" },
            { label: "Hết hạn", value: "expired" },
            { label: "Nháp", value: "draft" },
            { label: "Bị khóa", value: "locked" },
          ]}
          value={status}
        />

        <label className="block">
          <span className="sr-only">Địa điểm</span>
          <input
            aria-label="Lọc theo địa điểm"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Ví dụ: Cần Thơ"
            type="text"
            value={location}
          />
        </label>

        <SelectField
          ariaLabel="Hiệu quả"
          fieldId="job-filter-effectiveness"
          onChange={(value) =>
            onEffectivenessChange(value as "ALL" | "good" | "needsOptimization" | "new" | "ok")
          }
          options={[
            { label: "Hiệu quả", value: "ALL" },
            { label: "Tốt", value: "good" },
            { label: "Ổn", value: "ok" },
            { label: "Mới", value: "new" },
            { label: "Cần tối ưu", value: "needsOptimization" },
          ]}
          value={effectiveness}
        />

        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold whitespace-nowrap text-slate-700 transition hover:bg-slate-100"
          onClick={onClear}
          type="button"
        >
          <ListFilter aria-hidden className="h-4 w-4" />
          Xóa bộ lọc
        </button>
      </div>
    </section>
  );
}

function SelectField({
  ariaLabel,
  fieldId,
  onChange,
  options,
  value,
}: {
  ariaLabel: string;
  fieldId: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <label className="relative block" htmlFor={fieldId}>
      <span className="sr-only">{ariaLabel}</span>
      <select
        aria-label={ariaLabel}
        className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pr-8 pl-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        id={fieldId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <CaretDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
    </label>
  );
}
