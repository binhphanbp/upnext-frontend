"use client";

import {
  Archive,
  CaretLeft,
  CaretRight,
  List,
  MagnifyingGlass,
  Sparkle,
  SquaresFour,
  Users,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getRecruiterJobPosts } from "@/features/recruiter/job-posts/api";
import { getRecruiterSession } from "@/features/recruiter/session";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { formatAppDate } from "@/shared/lib/date";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

import type { AiSearchResultCard, TalentPoolCard } from "./api";
import { CandidatePoolCard } from "./candidate-pool-card";
import {
  useAiSearchTalentPool,
  useTalentPoolCapabilities,
  useTalentPoolSearch,
} from "./use-talent-pool";

const STORAGE_STATE_KEY = "upnext_talent_pool_state";
const STORAGE_AI_CACHE_PREFIX = "upnext_talent_pool_ai_cache_";

/**
 * Trang Kho CV.
 *
 * ## Vì sao danh sách hiện ngay, không cần bấm gì
 *
 * Đây là điểm khác biệt lớn nhất so với thiết kế AI Talent Discovery đã bỏ:
 * duyệt là hành động MIỄN PHÍ, luôn sẵn sàng, không cần một "lượt tìm" nào.
 * Chỉ XEM CHI TIẾT một hồ sơ cụ thể mới có thể trừ lượt (và chỉ lần đầu trong
 * kỳ). AI lọc theo JD là một hành động RIÊNG, trả phí, nằm trong tab thứ hai.
 */
export function RecruiterTalentPoolPage() {
  const t = useTranslations("Recruiter.talentPool");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [tab, setTab] = useState<"browse" | "ai">(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "ai" || urlTab === "browse") return urlTab;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.tab === "ai" || parsed.tab === "browse") return parsed.tab;
        }
      } catch {}
    }
    return "browse";
  });

  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    const urlView = searchParams.get("view");
    if (urlView === "list" || urlView === "grid") return urlView;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.viewMode === "list" || parsed.viewMode === "grid") return parsed.viewMode;
        }
      } catch {}
    }
    return "list";
  });

  const [page, setPage] = useState<number>(() => {
    const urlPage = Number(searchParams.get("page"));
    if (urlPage > 0) return urlPage;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Number(parsed.page) > 0) return Number(parsed.page);
        }
      } catch {}
    }
    return 1;
  });

  const [pageSize, setPageSize] = useState<number>(20);

  const [selectedJobPostId, setSelectedJobPostId] = useState<string>(() => {
    const urlJob = searchParams.get("jobPostId");
    if (urlJob) return urlJob;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_STATE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.selectedJobPostId) return parsed.selectedJobPostId;
        }
      } catch {}
    }
    return "";
  });

  const [aiResults, setAiResults] = useState<readonly AiSearchResultCard[] | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const targetJobId =
          searchParams.get("jobPostId") ||
          (() => {
            const saved = sessionStorage.getItem(STORAGE_STATE_KEY);
            return saved ? JSON.parse(saved).selectedJobPostId : "";
          })();
        if (targetJobId) {
          const cached = sessionStorage.getItem(STORAGE_AI_CACHE_PREFIX + targetJobId);
          if (cached) return JSON.parse(cached);
        }
      } catch {}
    }
    return null;
  });

  // Sync state changes with sessionStorage & URL search parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        STORAGE_STATE_KEY,
        JSON.stringify({ tab, selectedJobPostId, viewMode, page }),
      );
    } catch {}

    const params = new URLSearchParams();
    if (tab === "ai") {
      params.set("tab", "ai");
      if (selectedJobPostId) params.set("jobPostId", selectedJobPostId);
    }
    if (page > 1) params.set("page", String(page));
    if (viewMode === "grid") params.set("view", "grid");

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      const targetUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(targetUrl, { scroll: false });
    }
  }, [tab, selectedJobPostId, viewMode, page, pathname, router, searchParams]);

  const capabilitiesQuery = useTalentPoolCapabilities();
  const searchQuery = useTalentPoolSearch({ page, pageSize });
  const aiSearch = useAiSearchTalentPool();

  const jobPostsQuery = useQuery({
    queryKey: ["recruiter", "job-posts", "list"],
    queryFn: () => {
      const session = getRecruiterSession();
      if (!session) throw new Error("No session");
      return getRecruiterJobPosts(session.accessToken);
    },
    staleTime: 60_000,
    enabled: tab === "ai",
  });

  const capabilities = capabilitiesQuery.data ?? null;

  const handleViewDetail = (candidateProfileId: string) => {
    router.push(`/recruiter/talent-pool/${candidateProfileId}`);
  };

  const handleSelectJobPost = (jobPostId: string) => {
    setSelectedJobPostId(jobPostId);
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem(STORAGE_AI_CACHE_PREFIX + jobPostId);
        if (cached) {
          setAiResults(JSON.parse(cached));
          setPage(1);
          return;
        }
      } catch {}
    }
    setAiResults(null);
  };

  const handleAiSearch = () => {
    if (!selectedJobPostId) return;
    const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
    aiSearch.mutate(
      { jobPostId: selectedJobPostId, idempotencyKey },
      {
        onSuccess: (result) => {
          setAiResults(result.data);
          setPage(1);
          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem(
                STORAGE_AI_CACHE_PREFIX + selectedJobPostId,
                JSON.stringify(result.data),
              );
            } catch {}
          }
        },
        onError: (error) => {
          void Swal.fire({
            icon: "error",
            title: t("errors.aiSearchTitle"),
            text: error instanceof ApiError ? error.message : t("errors.generic"),
          });
        },
      },
    );
  };

  const cardCopy = {
    noHeadline: t("card.noHeadline"),
    viewDetail: t("card.viewDetail"),
    viewedBadge: t("card.viewedBadge"),
    matchScoreLabel: (score: number) => t("card.matchScoreLabel", { score }),
    activeSeeking: t("card.activeSeeking"),
    lastUpdated: (date: string) => t("card.lastUpdated", { date }),
    upgradeToViewCompany: t("card.upgradeToViewCompany"),
    noExperience: t("card.noExperience"),
    experienceYears: (years: number) => t("card.experienceYears", { years }),
    salaryNegotiable: t("card.salaryNegotiable"),
    hasCvTooltip: t("card.hasCvTooltip"),
    saveCandidate: t("card.saveCandidate"),
    savedCandidate: t("card.savedCandidate"),
  };

  const total = tab === "ai" ? (aiResults?.length ?? 0) : (searchQuery.data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fromItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toItem = Math.min(total, page * pageSize);

  const items: readonly TalentPoolCard[] =
    tab === "ai"
      ? (aiResults ?? []).slice((page - 1) * pageSize, page * pageSize)
      : (searchQuery.data?.data ?? []);
  const isLoadingList = tab === "ai" ? aiSearch.isPending : searchQuery.isLoading;

  return (
    <div className="space-y-5">
      {capabilities ? (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t("quota.label")}</p>
            <p className="text-sm text-slate-600">
              {capabilities.view.limit === null
                ? t("quota.unlimited")
                : t("quota.usageTemplate", {
                    used: capabilities.view.used,
                    limit: capabilities.view.limit,
                  })}
              {capabilities.view.periodEnd
                ? ` · ${t("quota.resetsOnTemplate", { date: formatAppDate(capabilities.view.periodEnd) })}`
                : ""}
            </p>
          </div>
          {!capabilities.unlocked ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/recruiter/pricing">{t("quota.upgradeAction")}</Link>
            </Button>
          ) : (
            <Badge tone="success">{t("quota.unlockedBadge")}</Badge>
          )}
        </Card>
      ) : null}

      {/* Tabs styled according to reference design */}
      <div className="border-brand flex items-end gap-2.5 border-b-2 pt-2">
        <TabButton
          active={tab === "browse"}
          onClick={() => {
            setTab("browse");
            setPage(1);
          }}
        >
          <Users size={18} weight="bold" aria-hidden />
          <span>{t("tabs.browse")}</span>
        </TabButton>
        <TabButton
          active={tab === "ai"}
          onClick={() => {
            setTab("ai");
            setPage(1);
          }}
        >
          <Sparkle size={18} weight={tab === "ai" ? "fill" : "bold"} aria-hidden />
          <span>{t("tabs.aiSearch")}</span>
          {capabilities && !capabilities.aiSearch.enabled ? (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                tab === "ai"
                  ? "border border-white/30 bg-white/20 text-white"
                  : "border border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {t("tabs.premiumBadge")}
            </span>
          ) : null}
        </TabButton>
      </div>

      {tab === "ai" ? (
        capabilities && !capabilities.aiSearch.enabled ? (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <Sparkle size={28} className="text-premium" aria-hidden />
            <p className="font-semibold text-slate-900">{t("aiSearch.upsellTitle")}</p>
            <p className="max-w-md text-sm text-slate-600">{t("aiSearch.upsellDescription")}</p>
            <Button asChild size="sm">
              <Link href="/recruiter/pricing">{t("quota.upgradeAction")}</Link>
            </Button>
          </Card>
        ) : (
          <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <Select value={selectedJobPostId} onValueChange={handleSelectJobPost}>
              <SelectTrigger className="sm:max-w-sm">
                <SelectValue placeholder={t("aiSearch.jobPostPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {(jobPostsQuery.data ?? []).map((post) => (
                  <SelectItem key={post.id} value={post.id}>
                    {post.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              disabled={!selectedJobPostId || aiSearch.isPending}
              onClick={handleAiSearch}
            >
              <MagnifyingGlass size={16} aria-hidden />
              {aiSearch.isPending ? t("aiSearch.searching") : t("aiSearch.searchAction")}
            </Button>
            {capabilities ? (
              <span className="text-xs text-slate-500 sm:ml-auto">
                {t("aiSearch.remainingTemplate", {
                  remaining:
                    capabilities.aiSearch.remaining === null
                      ? "∞"
                      : capabilities.aiSearch.remaining,
                })}
              </span>
            ) : null}
          </Card>
        )
      ) : null}

      {/* Search results toolbar: Result count & View Mode toggles */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-sm font-semibold text-slate-700">
          {t("searchResultsCount", { count: total })}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "list"
                ? "text-brand bg-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title={t("viewMode.list")}
            aria-label={t("viewMode.list")}
          >
            <List size={16} weight={viewMode === "list" ? "bold" : "regular"} />
            <span className="hidden sm:inline">{t("viewMode.list")}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === "grid"
                ? "text-brand bg-white font-semibold shadow-xs"
                : "text-slate-500 hover:text-slate-900"
            }`}
            title={t("viewMode.grid")}
            aria-label={t("viewMode.grid")}
          >
            <SquaresFour size={16} weight={viewMode === "grid" ? "bold" : "regular"} />
            <span className="hidden sm:inline">{t("viewMode.grid")}</span>
          </button>
        </div>
      </div>

      {isLoadingList ? (
        viewMode === "list" ? (
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <Archive size={28} className="text-slate-400" aria-hidden />
          <p className="text-slate-600">
            {tab === "ai" ? t("aiSearch.emptyResult") : t("browse.empty")}
          </p>
        </Card>
      ) : (
        <ul
          className={
            viewMode === "list"
              ? "flex flex-col gap-3.5"
              : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          }
        >
          {items.map((card) => (
            <li key={card.candidateProfileId}>
              <CandidatePoolCard
                card={card}
                copy={cardCopy}
                onViewDetail={handleViewDetail}
                viewMode={viewMode}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination Bar */}
      {total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 pb-2 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-slate-600 sm:text-sm">
            <span>
              {t("pagination.showingRange", {
                from: fromItem,
                to: toItem,
                total,
              })}
            </span>
            <span className="text-slate-300 select-none">|</span>
            <div className="flex items-center gap-1.5">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-28 bg-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">{t("pagination.perPage", { count: 10 })}</SelectItem>
                  <SelectItem value="20">{t("pagination.perPage", { count: 20 })}</SelectItem>
                  <SelectItem value="50">{t("pagination.perPage", { count: 50 })}</SelectItem>
                  <SelectItem value="100">{t("pagination.perPage", { count: 100 })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalPages > 1 ? (
            <nav
              className="flex items-center gap-1.5"
              aria-label={t("pagination.pageLabel", { page })}
            >
              <button
                type="button"
                aria-label={t("pagination.previous")}
                disabled={page <= 1}
                onClick={() => {
                  setPage((prev) => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CaretLeft size={16} weight="bold" />
              </button>

              {getPageNumbers(page, totalPages).map((entry, index) =>
                entry === "..." ? (
                  <span
                    key={`gap-${index}`}
                    className="px-1.5 text-xs text-slate-400 select-none"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={entry}
                    type="button"
                    aria-label={t("pagination.pageLabel", { page: entry })}
                    aria-current={entry === page ? "page" : undefined}
                    onClick={() => {
                      setPage(entry);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`flex h-8.5 min-w-8.5 cursor-pointer items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition ${
                      entry === page
                        ? "bg-brand border-brand border text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {entry}
                  </button>
                ),
              )}

              <button
                type="button"
                aria-label={t("pagination.next")}
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((prev) => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CaretRight size={16} weight="bold" />
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative -mb-[2px] flex cursor-pointer items-center gap-2 rounded-t-lg px-4.5 py-2 text-sm font-semibold transition-all duration-150 select-none ${
        active
          ? "border-brand bg-brand border-2 text-white shadow-xs"
          : "border-brand/60 text-brand hover:border-brand border-2 bg-white hover:bg-emerald-50/60"
      }`}
    >
      {children}
    </button>
  );
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const delta = 2;
  const pages: (number | "...")[] = [];
  let last = 0;

  for (let p = 1; p <= totalPages; p++) {
    const isEdge = p === 1 || p === totalPages;
    const isNearCurrent = p >= currentPage - delta && p <= currentPage + delta;
    if (!isEdge && !isNearCurrent) continue;

    if (last && p - last > 1) pages.push("...");
    pages.push(p);
    last = p;
  }

  return pages;
}
