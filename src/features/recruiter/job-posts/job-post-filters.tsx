"use client";

import { ArrowsClockwise, Funnel } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SearchInput } from "@/features/recruiter/components/interviews/search-input";
import {
  SelectFilter,
  type SelectFilterOption,
} from "@/features/recruiter/components/interviews/select-filter";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

type JobPostFiltersProps = Readonly<{
  search: string;
  status: string;
  poster: string;
  category: string;
  statusOptions: SelectFilterOption[];
  posterOptions: SelectFilterOption[];
  categoryOptions: SelectFilterOption[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPosterChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClear: () => void;
}>;

export function JobPostFilters({
  search,
  status,
  poster,
  category,
  statusOptions,
  posterOptions,
  categoryOptions,
  onSearchChange,
  onStatusChange,
  onPosterChange,
  onCategoryChange,
  onClear,
}: JobPostFiltersProps) {
  const t = useTranslations("Recruiter");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const activeFiltersCount = [status !== "ALL", poster !== "ALL", category !== "ALL"].filter(
    Boolean,
  ).length;
  const hasActiveFilters = search.trim().length > 0 || activeFiltersCount > 0;

  const renderFilterControls = () => (
    <div className="contents">
      <SelectFilter
        ariaLabel={t("jobPostsPage.filters.statusAria")}
        value={status}
        onChange={onStatusChange}
        options={statusOptions}
        placeholder={t("jobPostsPage.filters.statusPlaceholder")}
        className="w-full lg:w-48"
        triggerClassName={cn(
          "rounded-full",
          status !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <SelectFilter
        ariaLabel={t("jobPostsPage.filters.posterAria")}
        value={poster}
        onChange={onPosterChange}
        options={posterOptions}
        placeholder={t("jobPostsPage.filters.posterPlaceholder")}
        className="w-full lg:w-52"
        triggerClassName={cn(
          "rounded-full",
          poster !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <SelectFilter
        ariaLabel={t("jobPostsPage.filters.categoryAria")}
        value={category}
        onChange={onCategoryChange}
        options={categoryOptions}
        placeholder={t("jobPostsPage.filters.categoryPlaceholder")}
        className="w-full lg:w-52"
        showSearch={true}
        triggerClassName={cn(
          "rounded-full",
          category !== "ALL" && "border-emerald-500 bg-emerald-50/10 font-medium text-emerald-600",
        )}
      />
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-slate-200 px-4 text-xs font-semibold text-slate-600 shadow-none hover:bg-slate-50"
      >
        <ArrowsClockwise size={14} aria-hidden="true" />
        {t("jobPostsPage.filters.reset")}
      </Button>
    </div>
  );

  return (
    <section
      aria-label={t("jobPostsPage.filters.sectionAria")}
      className="sticky top-[-16px] z-30 -mx-4 -mt-4 border-y border-slate-200 bg-white px-4 py-4 md:top-[-32px] md:-mx-8 md:-mt-8 md:px-8"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden shrink-0 text-xs font-semibold text-slate-500 md:inline">
            {t("jobPostsPage.filters.label")}
          </span>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={t("jobPostsPage.filters.searchPlaceholder")}
              inputClassName="rounded-full"
            />
          </div>

          <button
            type="button"
            aria-expanded={showMobileFilters}
            aria-controls="job-post-mobile-filters"
            aria-label={
              showMobileFilters
                ? t("jobPostsPage.filters.hideAria")
                : t("jobPostsPage.filters.showAria")
            }
            onClick={() => setShowMobileFilters((visible) => !visible)}
            className={cn(
              "relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 lg:hidden",
              (showMobileFilters || activeFiltersCount > 0) &&
                "border-emerald-500 bg-emerald-50/10 text-emerald-600",
            )}
          >
            <Funnel
              size={18}
              weight={showMobileFilters || activeFiltersCount > 0 ? "bold" : "regular"}
              aria-hidden="true"
            />
            {activeFiltersCount > 0 ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                {activeFiltersCount}
              </span>
            ) : null}
          </button>

          <div className="hidden items-center gap-2 lg:flex">{renderFilterControls()}</div>
        </div>

        {showMobileFilters ? (
          <div
            id="job-post-mobile-filters"
            className="animate-in fade-in slide-in-from-top-2 flex flex-col gap-3 border-t border-slate-100 pt-3 duration-200 lg:hidden"
          >
            {renderFilterControls()}
          </div>
        ) : null}
      </div>
    </section>
  );
}
