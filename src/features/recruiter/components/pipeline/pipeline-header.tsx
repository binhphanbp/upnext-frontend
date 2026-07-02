import { DownloadSimple, Plus } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

import { SearchInput } from "./search-input";
import { SelectFilter, type SelectFilterOption } from "./select-filter";

type PipelineHeaderProps = Readonly<{
  search: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  roleOptions: SelectFilterOption[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  onAddCandidate?: () => void;
  onExport?: () => void;
}>;

export function PipelineHeader({
  search,
  onSearchChange,
  selectedRole,
  onRoleChange,
  roleOptions,
  onClearFilters,
  hasActiveFilters,
  onAddCandidate,
  onExport,
}: PipelineHeaderProps) {
  const t = useTranslations("Recruiter");

  return (
    <div className="flex shrink-0 flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Title and Job selection */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SelectFilter
            value={selectedRole}
            onChange={onRoleChange}
            options={roleOptions}
            placeholder="All Jobs"
            className="w-full sm:w-[260px]"
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              {t("pipeline.filters.clearFilters")}
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onExport}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50"
          >
            <DownloadSimple size={16} />
            <span>{t("pipeline.filters.exportBtn")}</span>
          </Button>
          <Button
            onClick={onAddCandidate}
            className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
          >
            <Plus size={16} weight="bold" />
            <span>{t("pipeline.filters.addCandidateBtn")}</span>
          </Button>
        </div>
      </div>

      <div className="my-1 border-t border-slate-100"></div>

      {/* Filter Row: Search box */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={t("pipeline.filters.searchPlaceholder")}
          />
        </div>
        <div className="text-xs font-medium text-slate-400">
          {t("pipeline.filters.showingFiltered")}
        </div>
      </div>
    </div>
  );
}
