"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useCandidateCompanyFollows } from "@/features/candidate/company-follows";
import { toast } from "@/shared/ui/toast";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import {
  getPublicCompanies,
  getPublicCompanyDetail,
  getPublicJobs,
  type PublicCompany,
  type PublicJob,
} from "./api";
import {
  ArrowRight,
  Briefcase,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  UsersRound,
} from "./marketing-icons";

type FeaturedCompaniesProps = {
  navigate: (path: string) => void;
};

type Company = {
  id: string;
  name: string;
  slug?: string;
  category: string;
  jobs: number;
  logo: string;
  logoColor: string;
};

type FeaturedCompany = Company & {
  tags: string[];
  description: string;
  /** Public company cover returned by the API. */
  cover: string;
};

// Company IDs are assigned by the API. They have a UUID-like hexadecimal
// shape, but the service does not guarantee RFC UUID version/variant bits.
const PERSISTABLE_COMPANY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

const COMPACT_COMPANIES_PER_PAGE = 9;
const COMPANIES_PER_PAGE = COMPACT_COMPANIES_PER_PAGE + 1;

function formatCompanyType(type: string) {
  return type
    .toLocaleLowerCase()
    .split(/[_\s-]+/u)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function getJobCountsByCompany(jobs: PublicJob[] | undefined) {
  const counts = new Map<string, number>();
  for (const job of jobs ?? []) {
    const companyId = job.company?.id;
    if (companyId) counts.set(companyId, (counts.get(companyId) ?? 0) + 1);
  }

  return counts;
}

function toCompany(company: PublicCompany, jobCounts: ReadonlyMap<string, number>): Company {
  return {
    id: company.id,
    name: company.name,
    ...(company.slug ? { slug: company.slug } : {}),
    category: formatCompanyType(company.type || "Technology"),
    jobs: jobCounts.get(company.id) ?? 0,
    logo: company.logoUrl || company.logoFile?.publicUrl || "",
    logoColor: "#10b981",
  };
}

function Logo({ company }: { company: Company | FeaturedCompany }) {
  const [failed, setFailed] = useState(false);
  if (!company.logo || failed) {
    return (
      <span
        className="featured-company-logo-mono"
        style={{ color: company.logoColor }}
        aria-hidden="true"
      >
        {company.name.charAt(0)}
      </span>
    );
  }
  return (
    <img
      src={company.logo}
      alt={`Logo ${company.name}`}
      width={56}
      height={56}
      className="size-full object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/** Cover photo for the featured card; shows a loading state before a real fallback. */
function CoverImage({ company, isLoading }: { company: FeaturedCompany; isLoading: boolean }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [company.cover]);

  if (!company.cover && isLoading) {
    return <span className="featured-company-featured-cover-loading" aria-hidden="true" />;
  }

  if (!company.cover || failed) {
    return (
      <span
        className="featured-company-featured-cover-fallback"
        style={{
          background: `linear-gradient(150deg, ${company.logoColor}, #0f172a)`,
        }}
      />
    );
  }
  return (
    <Image
      className="featured-company-featured-cover-img"
      src={company.cover}
      alt=""
      width={640}
      height={360}
      onError={() => setFailed(true)}
    />
  );
}

/** Responsive small-card count, aligned with the CSS breakpoints:
   - desktop (>1180px): full bento — featured + 9 cards
   - tablet (821-1180px): featured hidden, 6 small cards + slider
   - mobile (<=820px): featured only (0 small cards) + slider */
function useVisibleCount() {
  const getCount = () => {
    if (typeof window === "undefined") return 9;
    if (window.matchMedia("(max-width: 820px)").matches) return 0;
    if (window.matchMedia("(max-width: 1180px)").matches) return 6;
    return 9;
  };
  const [count, setCount] = useState(9);

  useEffect(() => {
    const update = () => setCount(getCount());
    update(); // Initialize count on mount
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export function FeaturedCompanies({ navigate }: FeaturedCompaniesProps) {
  const locale = useLocale();
  const notificationCopy =
    locale === "en"
      ? {
          followError: "Could not update followed companies. Please try again.",
          following: "Following",
          followedAgain: "Following again",
          follow: "Follow",
          undo: "Undo",
          undoFollow: "Undo following",
          unfollowed: "Unfollowed",
        }
      : {
          followError: "Không thể cập nhật công ty đang theo dõi. Vui lòng thử lại.",
          following: "Đã theo dõi",
          followedAgain: "Đã theo dõi lại",
          follow: "Theo dõi",
          undo: "Hoàn tác",
          undoFollow: "Hoàn tác theo dõi",
          unfollowed: "Đã bỏ theo dõi",
        };
  const followTooltip =
    locale === "en"
      ? {
          active: "You will be notified when this company posts a new job.",
          inactive: "Follow to receive alerts when this company posts a new job.",
        }
      : {
          active: "Bạn sẽ nhận thông báo khi công ty có việc làm mới.",
          inactive: "Theo dõi để nhận thông báo khi công ty có việc làm mới.",
        };
  const [pageIndex, setPageIndex] = useState(0);
  const visibleCount = useVisibleCount();
  const {
    error: companyFollowsError,
    followedCompanyIds,
    isPending: isCompanyFollowPending,
    isSessionResolved: isCompanyFollowsSessionResolved,
    setCompanyFollowing,
    toggleFollowCompany,
  } = useCandidateCompanyFollows();

  const {
    data: apiCompaniesData,
    isError: isCompaniesError,
    isLoading: isCompaniesLoading,
  } = useQuery({
    queryKey: ["public-companies", { limit: COMPANIES_PER_PAGE, page: pageIndex + 1 }],
    queryFn: () => getPublicCompanies({ limit: COMPANIES_PER_PAGE, page: pageIndex + 1 }),
    staleTime: 5 * 60_000,
  });

  const { data: apiJobsData, isLoading: isJobsLoading } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
    staleTime: 5 * 60_000,
  });
  const jobCounts = useMemo(() => getJobCountsByCompany(apiJobsData), [apiJobsData]);
  const page = useMemo(() => {
    const sourceCompanies = apiCompaniesData?.items;
    if (!sourceCompanies?.length) return null;

    const [spotlightSource, ...compactSources] = sourceCompanies;
    const featuredCompany = toCompany(spotlightSource!, jobCounts);

    return {
      featured: {
        ...featuredCompany,
        cover: spotlightSource!.coverFile?.publicUrl || "",
        tags: [featuredCompany.category],
        description: spotlightSource!.description || "Thông tin công ty đang được cập nhật.",
      } satisfies FeaturedCompany,
      companies: compactSources
        .map((company) => toCompany(company, jobCounts))
        .slice(0, COMPACT_COMPANIES_PER_PAGE),
    };
  }, [apiCompaniesData?.items, jobCounts]);
  const totalPages = apiCompaniesData?.meta.totalPages ?? 0;
  const totalCompanies = apiCompaniesData?.meta.total ?? 0;

  useEffect(() => {
    if (totalPages && pageIndex >= totalPages) setPageIndex(totalPages - 1);
  }, [pageIndex, totalPages]);

  const { data: featuredCompanyDetail, isFetching: isFeaturedCoverFetching } = useQuery({
    queryKey: ["public-featured-company-cover", page?.featured.slug],
    queryFn: () => getPublicCompanyDetail(page!.featured.slug!),
    enabled: Boolean(page?.featured.slug && !page.featured.cover),
    staleTime: 5 * 60_000,
  });

  const featured = useMemo(
    () =>
      page
        ? {
            ...page.featured,
            cover: featuredCompanyDetail?.coverFile?.publicUrl || page.featured.cover,
          }
        : null,
    [featuredCompanyDetail?.coverFile?.publicUrl, page],
  );

  const cards = useMemo(() => page?.companies.slice(0, visibleCount) ?? [], [page, visibleCount]);

  function showFollowError() {
    toast.error(notificationCopy.followError);
  }

  function followCompany(company: Company | FeaturedCompany) {
    const didStart = toggleFollowCompany(company.id, {
      onError: showFollowError,
      onSuccess: (isFollowing) => {
        const toastId = `follow-company-${company.id}`;
        toast.success(
          isFollowing
            ? `${notificationCopy.following} ${company.name}`
            : `${notificationCopy.unfollowed} ${company.name}`,
          {
            action: {
              label: notificationCopy.undo,
              onClick: () => {
                toast.dismiss(toastId);
                const didUndoStart = setCompanyFollowing(company.id, !isFollowing, {
                  onError: showFollowError,
                  onSuccess: (restored) => {
                    toast.success(
                      restored
                        ? `${notificationCopy.followedAgain} ${company.name}`
                        : `${notificationCopy.undoFollow} ${company.name}`,
                    );
                  },
                });
                if (!didUndoStart) navigate("/login?redirect=/");
              },
            },
            duration: 8_000,
            id: toastId,
          },
        );
      },
    });

    if (!didStart) navigate("/login?redirect=/");
  }

  function isFollowUnavailable(companyId: string) {
    return !PERSISTABLE_COMPANY_ID_PATTERN.test(companyId);
  }

  function step(delta: number) {
    if (totalPages < 2) return;
    setPageIndex((i) => (i + delta + totalPages) % totalPages);
  }

  return (
    <section className="marketing-home-companies" aria-label="Công ty công nghệ tiêu biểu">
      <header className="marketing-home-jobs-head">
        <div>
          <h2>Công ty công nghệ tiêu biểu</h2>
          <p>Khám phá những công ty công nghệ đang tuyển dụng nhiều việc làm IT chất lượng.</p>
        </div>
        <div className="marketing-home-co-head-actions">
          <span className="marketing-home-co-count">
            <UsersRound size={16} />
            {isCompaniesLoading
              ? "Đang tải công ty"
              : `${new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN").format(totalCompanies)} công ty tuyển dụng`}
          </span>
          <button
            type="button"
            className="marketing-home-jobs-all"
            onClick={() => navigate("/companies")}
          >
            Xem tất cả <ChevronRight size={16} />
          </button>
        </div>
      </header>
      {companyFollowsError ? (
        <p className="marketing-home-action-error" role="alert">
          Không thể đồng bộ danh sách công ty theo dõi. Vui lòng thử lại.
        </p>
      ) : null}

      {featured ? (
        <>
          <div className="marketing-home-co-stage">
            <button
              type="button"
              className="marketing-home-carousel-nav marketing-home-co-arrow marketing-home-co-arrow-prev"
              aria-label="Trang trước"
              disabled={totalPages < 2}
              onClick={() => step(-1)}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="marketing-home-co-bento" key={pageIndex}>
              <FeaturedCard
                company={featured}
                coverLoading={isFeaturedCoverFetching && !featured.cover}
                jobsLoading={isJobsLoading}
                following={followedCompanyIds.includes(featured.id)}
                onFollow={() => followCompany(featured)}
                followUnavailable={isFollowUnavailable(featured.id)}
                followLoading={
                  !isCompanyFollowsSessionResolved || isCompanyFollowPending(featured.id)
                }
                followTooltip={followTooltip}
                navigate={navigate}
              />

              {cards.map((company) => {
                const following = followedCompanyIds.includes(company.id);
                const followUnavailable = isFollowUnavailable(company.id);
                const followLoading =
                  !isCompanyFollowsSessionResolved || isCompanyFollowPending(company.id);

                return (
                  <article key={company.id} className="featured-company-card">
                    <button
                      type="button"
                      className="featured-company-card-main"
                      onClick={() => navigate("/companies")}
                    >
                      <span className="featured-company-logo">
                        <Logo company={company} />
                      </span>
                      <span className="featured-company-body">
                        <strong title={company.name}>{company.name}</strong>
                        <span className="featured-company-cat">{company.category}</span>
                        <span className="featured-company-jobs">
                          <Briefcase size={14} />
                          {isJobsLoading ? "Đang cập nhật việc làm" : `${company.jobs} việc làm`}
                        </span>
                      </span>
                    </button>
                    {followUnavailable ? (
                      <span className="featured-company-follow-status">Chưa hỗ trợ theo dõi</span>
                    ) : (
                      <FollowTooltip
                        content={following ? followTooltip.active : followTooltip.inactive}
                      >
                        <button
                          type="button"
                          className={`featured-company-follow${following ? " is-following" : ""}`}
                          aria-label={
                            followLoading
                              ? `Đang cập nhật theo dõi ${company.name}`
                              : following
                                ? `Bỏ theo dõi ${company.name}`
                                : `Theo dõi ${company.name}`
                          }
                          aria-busy={followLoading || undefined}
                          aria-pressed={following}
                          disabled={followLoading}
                          onClick={(event) => {
                            event.stopPropagation();
                            followCompany(company);
                          }}
                        >
                          {followLoading ? (
                            "Đang cập nhật…"
                          ) : following ? (
                            <>
                              <Check size={14} /> Đang theo dõi
                            </>
                          ) : (
                            <>
                              <Plus size={14} aria-hidden="true" /> Theo dõi
                            </>
                          )}
                        </button>
                      </FollowTooltip>
                    )}
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="marketing-home-carousel-nav marketing-home-co-arrow marketing-home-co-arrow-next"
              aria-label="Trang sau"
              disabled={totalPages < 2}
              onClick={() => step(1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {totalPages > 1 ? (
            <div className="marketing-home-co-dots" role="tablist" aria-label="Chọn trang công ty">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === pageIndex}
                  aria-label={`Trang ${i + 1}`}
                  className={`marketing-home-co-dot${i === pageIndex ? " is-active" : ""}`}
                  onClick={() => setPageIndex(i)}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="marketing-home-companies-empty" role={isCompaniesError ? "alert" : "status"}>
          {isCompaniesError
            ? "Không thể tải danh sách công ty lúc này. Vui lòng thử lại sau."
            : "Danh sách công ty đang được cập nhật."}
        </p>
      )}

      <button
        type="button"
        className="marketing-home-co-more"
        onClick={() => navigate("/companies")}
      >
        Xem tất cả công ty <ArrowRight size={16} />
      </button>
    </section>
  );
}

function FeaturedCard({
  company,
  coverLoading,
  jobsLoading,
  following,
  onFollow,
  followUnavailable,
  followLoading,
  followTooltip,
  navigate,
}: {
  company: FeaturedCompany;
  coverLoading: boolean;
  jobsLoading: boolean;
  following: boolean;
  onFollow: () => void;
  followUnavailable: boolean;
  followLoading: boolean;
  followTooltip: { active: string; inactive: string };
  navigate: (path: string) => void;
}) {
  return (
    <article className="featured-company-featured">
      <div className="featured-company-featured-cover" aria-hidden="true">
        <CoverImage company={company} isLoading={coverLoading} />
        {/* Gradient scrim blends the photo smoothly into the dark body. */}
        <span className="featured-company-featured-scrim" />
      </div>

      <span className="featured-company-featured-logo">
        <Logo company={company} />
      </span>

      <div className="featured-company-featured-body">
        <h3>{company.name}</h3>
        <div className="featured-company-featured-tags">
          {company.tags.map((tag) => (
            <i key={tag}>{tag}</i>
          ))}
        </div>
        <p>{company.description}</p>
        <span className="featured-company-featured-jobs">
          <Briefcase size={15} />
          {jobsLoading ? "Đang cập nhật việc làm" : `${company.jobs} việc làm đang tuyển`}
        </span>
        <div className="featured-company-featured-actions">
          <button
            type="button"
            className="featured-company-featured-view"
            onClick={() => navigate("/companies")}
          >
            Xem việc làm <ArrowRight size={15} />
          </button>
          {followUnavailable ? (
            <span className="featured-company-featured-follow-status">Chưa hỗ trợ theo dõi</span>
          ) : (
            <FollowTooltip content={following ? followTooltip.active : followTooltip.inactive}>
              <button
                type="button"
                className={`featured-company-featured-follow${following ? " is-following" : ""}`}
                aria-label={
                  followLoading
                    ? `Đang cập nhật theo dõi ${company.name}`
                    : following
                      ? `Bỏ theo dõi ${company.name}`
                      : `Theo dõi ${company.name}`
                }
                aria-busy={followLoading || undefined}
                aria-pressed={following}
                disabled={followLoading}
                onClick={onFollow}
              >
                {followLoading ? (
                  "Đang cập nhật…"
                ) : following ? (
                  <>
                    <Check size={15} /> Đang theo dõi
                  </>
                ) : (
                  <>
                    <Plus size={15} /> Theo dõi
                  </>
                )}
              </button>
            </FollowTooltip>
          )}
        </div>
      </div>
    </article>
  );
}

function FollowTooltip({ children, content }: { children: ReactElement; content: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        align="center"
        className="marketing-home-follow-tooltip"
        collisionPadding={16}
        hideWhenDetached
        side="top"
        sideOffset={10}
      >
        {content}
        <TooltipArrow className="marketing-home-follow-tooltip-arrow" height={6} width={12} />
      </TooltipContent>
    </Tooltip>
  );
}
