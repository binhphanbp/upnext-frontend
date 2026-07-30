"use client";

import {
  Briefcase,
  Check,
  MagnifyingGlass,
  MapPin,
  Plus,
  SealCheck,
  Users,
  X,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useCandidateCompanyFollows } from "@/features/candidate/company-follows";
import { getAllActivePublicCompanies, type PublicCompany } from "@/features/public/home/api";
import { Link } from "@/i18n/navigation";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { toast } from "@/shared/ui/toast";

import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import {
  buildCompanyFacets,
  type CompanyFilters,
  type CompanySizeBand,
  type CompanySort,
  EMPTY_COMPANY_FILTERS,
  extractCompanyCity,
  filterCompanies,
  hasActiveCompanyFilters,
  isCompanySort,
  localizeCompanyCity,
  parseReputationScore,
  REPUTATION_SCORE_MAX,
  reputationTier,
  type ReputationTier,
  sortCompanies,
} from "../companies-directory";

const PAGE_SIZE = 12;

type CompaniesListPageProps = {
  navigate: (path: string) => void;
};

const copyByLocale = {
  vi: {
    breadcrumbHome: "Trang chủ",
    breadcrumbCurrent: "Công ty",
    title: "Công ty IT đang tuyển dụng",
    subtitle:
      "Tìm hiểu nhà tuyển dụng trước khi ứng tuyển: quy mô, lĩnh vực, địa điểm và số vị trí đang mở.",
    searchLabel: "Tìm công ty",
    searchPlaceholder: "Tên công ty, lĩnh vực hoặc thành phố",
    clearSearch: "Xóa từ khóa",
    typeLabel: "Lĩnh vực",
    sizeLabel: "Quy mô",
    cityLabel: "Địa điểm",
    sortLabel: "Sắp xếp",
    allOption: "Tất cả",
    sortJobs: "Nhiều vị trí nhất",
    sortReputation: "Điểm uy tín cao nhất",
    sortName: "Tên A → Z",
    resultsOne: (n: string) => `Tìm thấy ${n} công ty`,
    clearFilters: "Xóa tất cả bộ lọc",
    loading: "Đang tải danh sách công ty…",
    error: "Không thể tải danh sách công ty từ hệ thống. Vui lòng thử lại.",
    emptyTitle: "Không tìm thấy công ty phù hợp",
    emptyBody: "Thử từ khóa khác hoặc bỏ một vài bộ lọc để mở rộng phạm vi tìm kiếm.",
    noneTitle: "Hiện chưa có công ty đang hoạt động",
    noneBody: "Danh sách sẽ hiển thị ngay khi có nhà tuyển dụng mở vị trí mới.",
    verified: "Đã xác thực",
    jobsCount: (n: number) => `${n} vị trí đang mở`,
    employees: (size: string) => `${size} nhân sự`,
    viewCompany: "Xem công ty",
    pagination: "Phân trang",
    previousPage: "Trang trước",
    nextPage: "Trang sau",
    pageLabel: (n: number) => `Trang ${n}`,
    sizeUnit: "nhân sự",
    sizeBands: {
      "under-1000": "Dưới 1.000 nhân sự",
      "1000-5000": "1.000 – 5.000 nhân sự",
      "over-5000": "Trên 5.000 nhân sự",
    } satisfies Record<CompanySizeBand, string>,
    reputationLabel: "Điểm uy tín",
    reputationValue: (score: number) => `${score}/${REPUTATION_SCORE_MAX}`,
    reputationTiers: {
      excellent: "Xuất sắc",
      high: "Cao",
      fair: "Khá",
      low: "Thấp",
    } satisfies Record<ReputationTier, string>,
    reputationHint: (score: number) =>
      `Điểm uy tín ${score}/${REPUTATION_SCORE_MAX} do UpNext đánh giá dựa trên mức độ hoàn thiện hồ sơ và hoạt động tuyển dụng.`,
    reputationUnscored: "Chưa có điểm uy tín",
    follow: "Theo dõi",
    following: "Đang theo dõi",
    followAria: (name: string) => `Theo dõi ${name}`,
    unfollowAria: (name: string) => `Bỏ theo dõi ${name}`,
    followed: (name: string) => `Đã theo dõi ${name}`,
    unfollowed: (name: string) => `Đã bỏ theo dõi ${name}`,
    followError: "Không thể cập nhật theo dõi. Vui lòng thử lại.",
    followHint: "Theo dõi để nhận thông báo khi công ty có việc làm mới.",
    resultsListLabel: "Danh sách công ty",
  },
  en: {
    breadcrumbHome: "Home",
    breadcrumbCurrent: "Companies",
    title: "IT companies that are hiring",
    subtitle:
      "Research an employer before you apply: size, focus, location, and how many roles are open.",
    searchLabel: "Search companies",
    searchPlaceholder: "Company name, focus, or city",
    clearSearch: "Clear search",
    typeLabel: "Focus",
    sizeLabel: "Size",
    cityLabel: "Location",
    sortLabel: "Sort by",
    allOption: "All",
    sortJobs: "Most open roles",
    sortReputation: "Highest reputation",
    sortName: "Name A → Z",
    resultsOne: (n: string) => `${n} companies found`,
    clearFilters: "Clear all filters",
    loading: "Loading companies…",
    error: "Could not load companies. Please try again.",
    emptyTitle: "No companies match your filters",
    emptyBody: "Try a different keyword or drop a filter to widen the search.",
    noneTitle: "No active companies yet",
    noneBody: "Companies appear here as soon as an employer opens a new role.",
    verified: "Verified",
    jobsCount: (n: number) => `${n} open ${n === 1 ? "role" : "roles"}`,
    employees: (size: string) => `${size} employees`,
    viewCompany: "View company",
    pagination: "Pagination",
    previousPage: "Previous page",
    nextPage: "Next page",
    pageLabel: (n: number) => `Page ${n}`,
    sizeUnit: "employees",
    sizeBands: {
      "under-1000": "Under 1,000 employees",
      "1000-5000": "1,000 – 5,000 employees",
      "over-5000": "Over 5,000 employees",
    } satisfies Record<CompanySizeBand, string>,
    reputationLabel: "Reputation",
    reputationValue: (score: number) => `${score}/${REPUTATION_SCORE_MAX}`,
    reputationTiers: {
      excellent: "Excellent",
      high: "High",
      fair: "Fair",
      low: "Low",
    } satisfies Record<ReputationTier, string>,
    reputationHint: (score: number) =>
      `UpNext reputation score of ${score}/${REPUTATION_SCORE_MAX}, based on profile completeness and hiring activity.`,
    reputationUnscored: "Not scored yet",
    follow: "Follow",
    following: "Following",
    followAria: (name: string) => `Follow ${name}`,
    unfollowAria: (name: string) => `Unfollow ${name}`,
    followed: (name: string) => `Now following ${name}`,
    unfollowed: (name: string) => `Unfollowed ${name}`,
    followError: "Could not update follow. Please try again.",
    followHint: "Follow to get alerts when this company posts a new role.",
    resultsListLabel: "Company results",
  },
} as const;

/** Company focus arrives as an enum, so give the known values real names per locale. */
const COMPANY_TYPE_LABELS: Record<string, { vi: string; en: string }> = {
  PRODUCT: { vi: "Product", en: "Product" },
  OUTSOURCING: { vi: "Outsourcing", en: "Outsourcing" },
  OTHER: { vi: "Khác", en: "Other" },
};

function companyTypeLabel(type: string, locale: "vi" | "en") {
  return COMPANY_TYPE_LABELS[type]?.[locale] ?? type;
}

function companyDetailPath(company: PublicCompany) {
  return company.slug ? `/companies/${encodeURIComponent(company.slug)}` : "/companies";
}

/** Mirrors the jobs list pagination so both public lists elide long page runs the same way. */
function getPageNumbers(currentPage: number, totalPages: number) {
  const delta = 2;
  const pages: (number | "...")[] = [];
  let last = 0;

  for (let page = 1; page <= totalPages; page++) {
    const isEdge = page === 1 || page === totalPages;
    const isNearCurrent = page >= currentPage - delta && page <= currentPage + delta;
    if (!isEdge && !isNearCurrent) continue;

    if (last && page - last > 1) pages.push("...");
    pages.push(page);
    last = page;
  }

  return pages;
}

function CompanyLogo({ company }: { company: PublicCompany }) {
  const [failed, setFailed] = useState(false);
  const src = company.logoUrl || company.logoFile?.publicUrl || "";

  if (!src || failed) {
    return (
      <span
        className="flex size-full items-center justify-center rounded-xl bg-emerald-50 text-xl font-extrabold text-emerald-700"
        aria-hidden="true"
      >
        {company.name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    // Logos come from API-controlled external hosts, so a native image avoids a host allowlist.
    // oxlint-disable-next-line next/no-img-element
    <img
      src={src}
      alt={`Logo ${company.name}`}
      className="size-full rounded-xl object-contain"
      onError={() => setFailed(true)}
    />
  );
}

const REPUTATION_TIER_CLASSES: Record<ReputationTier, { bar: string; text: string }> = {
  excellent: { bar: "bg-emerald-500", text: "text-emerald-700" },
  high: { bar: "bg-emerald-500", text: "text-emerald-700" },
  fair: { bar: "bg-amber-400", text: "text-amber-700" },
  low: { bar: "bg-slate-300", text: "text-slate-500" },
};

/**
 * Shows the score as a meter plus its tier, so a company is readable at a glance without implying
 * that a five-point gap is a meaningful ranking. An unscored company says so rather than showing a
 * zero-length bar, which would read as the worst possible score.
 */
function ReputationMeter({
  score,
  copy,
}: {
  score: number | null;
  copy: (typeof copyByLocale)["vi"] | (typeof copyByLocale)["en"];
}) {
  if (score === null) {
    return (
      <p className="mt-3 text-[11px] font-semibold text-slate-400">{copy.reputationUnscored}</p>
    );
  }

  const tier = reputationTier(score);
  const classes = REPUTATION_TIER_CLASSES[tier];
  const percent = Math.max(0, Math.min(100, (score / REPUTATION_SCORE_MAX) * 100));

  return (
    <div className="mt-3" title={copy.reputationHint(score)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
          {copy.reputationLabel}
        </span>
        <span className={`text-[11px] font-extrabold ${classes.text}`}>
          {copy.reputationValue(score)} · {copy.reputationTiers[tier]}
        </span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={REPUTATION_SCORE_MAX}
        aria-label={copy.reputationLabel}
      >
        <span
          className={`block h-full rounded-full ${classes.bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function PublicCompaniesListPage({ navigate }: CompaniesListPageProps) {
  const locale = useLocale();
  const currentLocale = locale === "en" ? "en" : "vi";
  const copy = copyByLocale[currentLocale];
  const params = useSearchParams();

  // Deep links from the header mega menu and shared URLs seed the controls.
  const queryParam = params.get("q") ?? "";
  const typeParam = params.get("type") ?? "";
  const sizeParam = params.get("size") ?? "";
  const cityParam = params.get("city") ?? "";
  const sortParam = params.get("sort");
  const sortFromParam = isCompanySort(sortParam) ? sortParam : "jobs";

  // Seeded straight from the URL so a deep link paints its results on the first render.
  const [query, setQuery] = useState(queryParam);
  const [type, setType] = useState(typeParam);
  const [size, setSize] = useState(sizeParam);
  const [city, setCity] = useState(cityParam);
  const [sort, setSort] = useState<CompanySort>(sortFromParam);
  const [page, setPage] = useState(1);

  // Navigating to a different query string keeps this component mounted, so the controls have to
  // follow the URL when it changes underneath them.
  useEffect(() => {
    setQuery(queryParam);
    setType(typeParam);
    setSize(sizeParam);
    setCity(cityParam);
    setSort(sortFromParam);
    setPage(1);
  }, [cityParam, queryParam, sizeParam, sortFromParam, typeParam]);

  const { data, isError, isPending } = useQuery({
    queryKey: ["public-companies", "all-active"],
    queryFn: getAllActivePublicCompanies,
  });

  const {
    followedCompanyIds,
    isPending: isFollowPending,
    isSessionResolved: isFollowSessionResolved,
    setCompanyFollowing,
    toggleFollowCompany,
  } = useCandidateCompanyFollows();
  const followedIds = useMemo(() => new Set(followedCompanyIds), [followedCompanyIds]);

  /** Follows from the directory, or sends a guest to log in and return to this exact list. */
  function handleToggleFollow(company: PublicCompany) {
    const didStart = toggleFollowCompany(company.id, {
      onError: () => toast.error(copy.followError),
      onSuccess: (isFollowing) => {
        const toastId = `follow-company-${company.id}`;
        toast.success(isFollowing ? copy.followed(company.name) : copy.unfollowed(company.name), {
          id: toastId,
          action: {
            label: currentLocale === "en" ? "Undo" : "Hoàn tác",
            onClick: () => {
              toast.dismiss(toastId);
              setCompanyFollowing(company.id, !isFollowing, {
                onError: () => toast.error(copy.followError),
              });
            },
          },
        });
      },
    });

    if (!didStart) {
      const redirect = `/companies${window.location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }

  // A fresh [] on every render would defeat each useMemo below it.
  const companies = useMemo(() => data?.items ?? [], [data]);

  // Typing stays responsive on a 100-company grid by letting the filter pass lag a frame.
  const deferredQuery = useDeferredValue(query);
  const filters: CompanyFilters = useMemo(
    () => ({ ...EMPTY_COMPANY_FILTERS, query: deferredQuery, type, size, city }),
    [city, deferredQuery, size, type],
  );

  const facets = useMemo(() => buildCompanyFacets(companies, filters), [companies, filters]);
  const results = useMemo(
    () => sortCompanies(filterCompanies(companies, filters), sort),
    [companies, filters, sort],
  );

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shown = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filtersActive = hasActiveCompanyFilters(filters);
  const totalLabel = results.length.toLocaleString(currentLocale === "en" ? "en-US" : "vi-VN");

  function resetFilters() {
    setQuery("");
    setType("");
    setSize("");
    setCity("");
    setPage(1);
  }

  const selectClass =
    "h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none";
  const labelClass = "mb-1.5 block text-xs font-bold tracking-wide text-slate-500 uppercase";

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader navigate={navigate} />

      <div className="mx-auto w-[min(1180px,calc(100%-48px))] py-6">
        <Breadcrumb
          items={[{ label: copy.breadcrumbHome, href: "/" }, { label: copy.breadcrumbCurrent }]}
        />

        <header className="mt-5">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{copy.subtitle}</p>
        </header>

        {/* Toolbar */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
            <div>
              <label className={labelClass} htmlFor="companies-search">
                {copy.searchLabel}
              </label>
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="companies-search"
                  type="search"
                  value={query}
                  aria-label={copy.searchLabel}
                  placeholder={copy.searchPlaceholder}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-9 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={copy.clearSearch}
                    onClick={() => {
                      setQuery("");
                      setPage(1);
                    }}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded p-1 text-slate-400 transition hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="companies-type">
                {copy.typeLabel}
              </label>
              <select
                id="companies-type"
                className={selectClass}
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{copy.allOption}</option>
                {facets.types.map((option) => (
                  <option key={option.value} value={option.value}>
                    {companyTypeLabel(option.value, currentLocale)} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="companies-size">
                {copy.sizeLabel}
              </label>
              <select
                id="companies-size"
                className={selectClass}
                value={size}
                onChange={(event) => {
                  setSize(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{copy.allOption}</option>
                {facets.sizes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {copy.sizeBands[option.value as CompanySizeBand] ?? option.value} (
                    {option.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="companies-city">
                {copy.cityLabel}
              </label>
              <select
                id="companies-city"
                className={selectClass}
                value={city}
                onChange={(event) => {
                  setCity(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{copy.allOption}</option>
                {facets.cities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {localizeCompanyCity(option.value, currentLocale)} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="companies-sort">
                {copy.sortLabel}
              </label>
              <select
                id="companies-sort"
                className={selectClass}
                value={sort}
                onChange={(event) => setSort(event.target.value as CompanySort)}
              >
                <option value="jobs">{copy.sortJobs}</option>
                <option value="reputation">{copy.sortReputation}</option>
                <option value="name">{copy.sortName}</option>
              </select>
            </div>
          </div>

          {!isPending && !isError ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <output className="text-sm font-semibold text-slate-700">
                {copy.resultsOne(totalLabel)}
              </output>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="cursor-pointer text-xs font-bold text-emerald-700 transition hover:text-emerald-800"
                >
                  {copy.clearFilters}
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Results */}
        {isPending ? (
          <output className="block py-20 text-center text-sm font-semibold text-slate-500">
            {copy.loading}
          </output>
        ) : isError ? (
          <p className="py-20 text-center text-sm font-semibold text-rose-600" role="alert">
            {copy.error}
          </p>
        ) : companies.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-lg font-extrabold text-slate-900">{copy.noneTitle}</h2>
            <p className="mt-2 text-sm text-slate-500">{copy.noneBody}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center">
            <h2 className="text-lg font-extrabold text-slate-900">{copy.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{copy.emptyBody}</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              {copy.clearFilters}
            </button>
          </div>
        ) : (
          <>
            <ul
              aria-label={copy.resultsListLabel}
              className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3"
            >
              {shown.map((company) => {
                const companyCity = localizeCompanyCity(
                  extractCompanyCity(company.address),
                  currentLocale,
                );
                const href = companyDetailPath(company);
                const isFollowed = followedIds.has(company.id);
                const followBusy = isFollowPending(company.id);

                return (
                  <li key={company.id}>
                    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
                      <div className="flex items-start gap-3.5">
                        <span className="size-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white">
                          <CompanyLogo company={company} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-extrabold text-slate-900">
                            {/* A real link, so a directory entry is crawlable and can be opened
                                in a new tab like any other search result. */}
                            <Link
                              href={href}
                              title={company.name}
                              className="rounded transition hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
                            >
                              {company.name}
                            </Link>
                          </h2>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
                            <span>{companyTypeLabel(company.type, currentLocale)}</span>
                            {company.verificationStatus === "VERIFIED" ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700">
                                <SealCheck size={13} weight="fill" aria-hidden="true" />
                                {copy.verified}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      {company.description ? (
                        <p className="mt-3.5 line-clamp-3 text-xs leading-5 text-slate-600">
                          {company.description}
                        </p>
                      ) : null}

                      <dl className="mt-auto grid gap-2 pt-4 text-xs font-semibold text-slate-600">
                        {companyCity ? (
                          <div className="flex items-center gap-2">
                            <dt className="sr-only">{copy.cityLabel}</dt>
                            <MapPin size={14} aria-hidden="true" className="text-slate-400" />
                            <dd className="truncate">{companyCity}</dd>
                          </div>
                        ) : null}
                        {company.companySize ? (
                          <div className="flex items-center gap-2">
                            <dt className="sr-only">{copy.sizeLabel}</dt>
                            <Users size={14} aria-hidden="true" className="text-slate-400" />
                            <dd>{copy.employees(company.companySize)}</dd>
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2 text-emerald-700">
                          <dt className="sr-only">{copy.jobsCount(company.activeJobsCount)}</dt>
                          <Briefcase size={14} aria-hidden="true" />
                          <dd>{copy.jobsCount(company.activeJobsCount)}</dd>
                        </div>
                      </dl>

                      <ReputationMeter
                        score={parseReputationScore(company.reputationScore)}
                        copy={copy}
                      />

                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          href={href}
                          aria-label={`${copy.viewCompany}: ${company.name}`}
                          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-emerald-600 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
                        >
                          {copy.viewCompany}
                        </Link>
                        {/* Following from the list saves a round trip through the detail page.
                            Hidden until the session resolves so the label never flips under the
                            cursor from "Theo dõi" to "Đang theo dõi" a moment after paint. */}
                        <button
                          type="button"
                          disabled={followBusy || !isFollowSessionResolved}
                          aria-pressed={isFollowed}
                          aria-label={
                            isFollowed
                              ? copy.unfollowAria(company.name)
                              : copy.followAria(company.name)
                          }
                          title={copy.followHint}
                          onClick={() => handleToggleFollow(company)}
                          className={`flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            isFollowed
                              ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                          }`}
                        >
                          {isFollowed ? (
                            <Check size={14} weight="bold" aria-hidden="true" />
                          ) : (
                            <Plus size={14} weight="bold" aria-hidden="true" />
                          )}
                          {isFollowed ? copy.following : copy.follow}
                        </button>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>

            {totalPages > 1 ? (
              <nav
                className="mt-8 flex items-center justify-center gap-2 pb-4"
                aria-label={copy.pagination}
              >
                <button
                  type="button"
                  aria-label={copy.previousPage}
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">‹</span>
                </button>
                {getPageNumbers(currentPage, totalPages).map((entry, index) =>
                  entry === "..." ? (
                    <span
                      key={`gap-${index}`}
                      className="px-1 text-slate-400 select-none"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={entry}
                      type="button"
                      aria-label={copy.pageLabel(entry)}
                      aria-current={entry === currentPage ? "page" : undefined}
                      onClick={() => setPage(entry)}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        entry === currentPage
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {entry}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  aria-label={copy.nextPage}
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">›</span>
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>

      <PublicFooter navigate={navigate} />
    </main>
  );
}
