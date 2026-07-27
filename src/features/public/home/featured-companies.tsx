"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useCandidateCompanyFollows } from "@/features/candidate/company-follows";
import { toast } from "@/shared/ui/toast";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { getAllActivePublicCompanies, getPublicCompanyDetail } from "./api";
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
  /** Cover photo under /public/assets/marketing/home/covers. Falls back to a gradient. */
  cover: string;
};

// Company IDs are assigned by the API. They have a UUID-like hexadecimal
// shape, but the service does not guarantee RFC UUID version/variant bits.
// Keep the shape check so marketing fallback IDs (for example, "fpt") are
// never sent to the follow endpoint.
const PERSISTABLE_COMPANY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

type CompanyPage = {
  featured: FeaturedCompany;
  companies: Company[];
};

function getCompanyDetailPath(company: Company | FeaturedCompany) {
  return company.slug ? `/companies/${encodeURIComponent(company.slug)}` : "/companies";
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

/** Cover photo for the featured card; falls back to a brand gradient. */
function CoverImage({ company }: { company: FeaturedCompany }) {
  const [failed, setFailed] = useState(false);
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
    data: apiCosData,
    isError: isCompaniesError,
    isPending: isCompaniesPending,
  } = useQuery({
    queryKey: ["public-companies", "all-active"],
    queryFn: getAllActivePublicCompanies,
  });

  const pages = useMemo(() => {
    const apiItems = apiCosData?.items ?? [];
    const mapped: Company[] = apiItems.map((co) => ({
      id: co.id,
      name: co.name,
      ...(co.slug ? { slug: co.slug } : {}),
      category: co.type || "Technology",
      jobs: co.activeJobsCount,
      logo: co.logoUrl || co.logoFile?.publicUrl || "",
      logoColor: "#10b981",
    }));

    const result: CompanyPage[] = [];
    const PAGE_SIZE = 10;

    for (let i = 0; i < mapped.length; i += PAGE_SIZE) {
      const chunk = mapped.slice(i, i + PAGE_SIZE);
      const first = apiItems[i]!;
      const featured: FeaturedCompany = {
        id: first.id,
        name: first.name,
        ...(first.slug ? { slug: first.slug } : {}),
        category: first.type || "Technology",
        jobs: first.activeJobsCount,
        logo: first.logoUrl || first.logoFile?.publicUrl || "",
        logoColor: "#10b981",
        cover: "",
        tags: [first.type || "Technology"],
        description: first.description || "",
      };

      result.push({
        featured,
        companies: chunk.slice(1),
      });
    }

    return result;
  }, [apiCosData]);

  const page = pages[pageIndex] ?? null;
  const totalPages = pages.length;

  const { data: featuredCompanyDetail } = useQuery({
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
  const totalCompanies = apiCosData?.meta.total.toLocaleString(locale === "en" ? "en-US" : "vi-VN");

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
    if (totalPages === 0) return;
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
            {totalCompanies ?? "…"} công ty tuyển dụng
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
              onClick={() => step(-1)}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="marketing-home-co-bento" key={pageIndex}>
              <FeaturedCard
                company={featured}
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
                      onClick={() => navigate(getCompanyDetailPath(company))}
                    >
                      <span className="featured-company-logo">
                        <Logo company={company} />
                      </span>
                      <span className="featured-company-body">
                        <strong title={company.name}>{company.name}</strong>
                        <span className="featured-company-cat">{company.category}</span>
                        <span className="featured-company-jobs">
                          <Briefcase size={14} />
                          {company.jobs} việc làm
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
              onClick={() => step(1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="marketing-home-co-dots" role="tablist" aria-label="Chọn trang công ty">
            {pages.map((_, i) => (
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
        </>
      ) : (
        <p className="marketing-home-action-error" role={isCompaniesPending ? "status" : "alert"}>
          {isCompaniesPending
            ? "Đang tải danh sách công ty…"
            : isCompaniesError
              ? "Không thể tải danh sách công ty từ hệ thống. Vui lòng thử lại."
              : "Hiện chưa có công ty đang hoạt động."}
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
  following,
  onFollow,
  followUnavailable,
  followLoading,
  followTooltip,
  navigate,
}: {
  company: FeaturedCompany;
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
        <CoverImage company={company} />
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
        {company.description ? <p>{company.description}</p> : null}
        <span className="featured-company-featured-jobs">
          <Briefcase size={15} />
          {company.jobs} việc làm đang tuyển
        </span>
        <div className="featured-company-featured-actions">
          <button
            type="button"
            className="featured-company-featured-view"
            onClick={() => navigate(getCompanyDetailPath(company))}
          >
            Xem công ty <ArrowRight size={15} />
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
