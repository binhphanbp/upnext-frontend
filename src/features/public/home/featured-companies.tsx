"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { useCandidateCompanyFollows } from "@/features/candidate/company-follows";
import { toast } from "@/shared/ui/toast";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

import { getPublicCompanies, getPublicCompanyDetail } from "./api";
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

const logo = (file: string) => `/assets/marketing/home/companies/${file}`;
const cover = (file: string) => `/assets/marketing/home/covers/${file}`;
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

const COMPACT_COMPANIES_PER_PAGE = 9;

/**
 * API IDs are authoritative, but fallback and API records can represent the
 * same company with different IDs. Use a human-stable key so one employer is
 * never rendered twice in a single bento page.
 */
function companyKey(company: Pick<Company, "id" | "name" | "slug">) {
  const normalizedSlug = company.slug?.trim().toLocaleLowerCase();
  if (normalizedSlug) return `slug:${normalizedSlug}`;

  const normalizedName = company.name.trim().toLocaleLowerCase();
  if (normalizedName) return `name:${normalizedName}`;

  return `id:${company.id}`;
}

function getCompactCompanies(
  featured: Pick<Company, "id" | "name" | "slug">,
  companies: Company[],
  fallbackCompanies: Company[] = [],
) {
  const seen = new Set([companyKey(featured)]);
  const compactCompanies: Company[] = [];

  for (const company of [...companies, ...fallbackCompanies]) {
    const key = companyKey(company);
    if (seen.has(key)) continue;

    seen.add(key);
    compactCompanies.push(company);

    if (compactCompanies.length === COMPACT_COMPANIES_PER_PAGE) break;
  }

  return compactCompanies;
}

// Each desktop page has one featured spotlight and 9 compact cards. The 3 + 2 +
// 2 + 2 arrangement keeps the last row balanced while the spotlight fills the
// third column across rows two to four. `getCompactCompanies` removes the
// spotlight from this list before it is rendered.
const staticPages: CompanyPage[] = [
  {
    featured: {
      id: "fpt",
      name: "FPT Software",
      category: "Outsourcing",
      jobs: 158,
      logo: logo("fpt.png"),
      logoColor: "#0a66c2",
      cover: cover("fpt.jpg"),
      tags: ["Outsourcing", "Công nghệ"],
      description:
        "FPT Software là công ty công nghệ hàng đầu Việt Nam, cung cấp các giải pháp và dịch vụ CNTT tiên tiến cho khách hàng toàn cầu.",
    },
    companies: [
      {
        id: "fpt",
        name: "FPT Software",
        category: "Outsourcing",
        jobs: 512,
        logo: logo("fpt.png"),
        logoColor: "#0a66c2",
      },
      {
        id: "vng",
        name: "VNG Corporation",
        category: "Product",
        jobs: 342,
        logo: logo("vng.png"),
        logoColor: "#1a8cff",
      },
      {
        id: "tiki",
        name: "Tiki",
        category: "E-commerce",
        jobs: 274,
        logo: logo("tiki.png"),
        logoColor: "#1a94ff",
      },
      {
        id: "momo",
        name: "MoMo",
        category: "Fintech",
        jobs: 193,
        logo: logo("momo.png"),
        logoColor: "#a50064",
      },
      {
        id: "kms",
        name: "KMS Technology",
        category: "Product",
        jobs: 167,
        logo: "",
        logoColor: "#0aa56f",
      },
      {
        id: "viettel",
        name: "Viettel Solutions",
        category: "Công nghệ",
        jobs: 181,
        logo: logo("viettel.png"),
        logoColor: "#ee0033",
      },
      {
        id: "nashtech",
        name: "NashTech",
        category: "Outsourcing",
        jobs: 118,
        logo: "",
        logoColor: "#e11d48",
      },
      {
        id: "coccoc",
        name: "Cốc Cốc",
        category: "Công nghệ",
        jobs: 126,
        logo: "",
        logoColor: "#f97316",
      },
      {
        id: "axon",
        name: "Axon Active",
        category: "Product",
        jobs: 92,
        logo: "",
        logoColor: "#475569",
      },
      {
        id: "kardiachain",
        name: "KardiaChain",
        category: "Blockchain",
        jobs: 71,
        logo: "",
        logoColor: "#1d4ed8",
      },
      {
        id: "teko",
        name: "Teko Vietnam",
        category: "Product",
        jobs: 58,
        logo: "",
        logoColor: "#16a34a",
      },
    ],
  },
  {
    featured: {
      id: "vnpay",
      name: "VNPAY",
      category: "Fintech",
      jobs: 134,
      logo: logo("vnpay.png"),
      logoColor: "#005baa",
      cover: cover("vnpay.jpg"),
      tags: ["Fintech", "Thanh toán"],
      description:
        "VNPAY là đơn vị tiên phong về giải pháp thanh toán điện tử tại Việt Nam, phục vụ hàng chục triệu người dùng và đối tác ngân hàng.",
    },
    companies: [
      {
        id: "vnpay",
        name: "VNPAY",
        category: "Fintech",
        jobs: 210,
        logo: logo("vnpay.png"),
        logoColor: "#005baa",
      },
      {
        id: "shopee",
        name: "Shopee",
        category: "E-commerce",
        jobs: 188,
        logo: "",
        logoColor: "#ee4d2d",
      },
      {
        id: "grab",
        name: "Grab",
        category: "Product",
        jobs: 156,
        logo: "",
        logoColor: "#00b14f",
      },
      {
        id: "zalo",
        name: "Zalo",
        category: "Product",
        jobs: 142,
        logo: "",
        logoColor: "#0068ff",
      },
      {
        id: "techcombank",
        name: "Techcombank",
        category: "Fintech",
        jobs: 98,
        logo: "",
        logoColor: "#e4002b",
      },
      {
        id: "sun",
        name: "Sun Asterisk",
        category: "Outsourcing",
        jobs: 134,
        logo: "",
        logoColor: "#f59e0b",
      },
      {
        id: "rikkei",
        name: "Rikkeisoft",
        category: "Outsourcing",
        jobs: 109,
        logo: "",
        logoColor: "#2563eb",
      },
      {
        id: "onemount",
        name: "One Mount Group",
        category: "Product",
        jobs: 77,
        logo: "",
        logoColor: "#7c3aed",
      },
      {
        id: "gotit",
        name: "Got It AI",
        category: "AI / Data",
        jobs: 64,
        logo: "",
        logoColor: "#0891b2",
      },
      {
        id: "be",
        name: "Be Group",
        category: "Product",
        jobs: 52,
        logo: "",
        logoColor: "#facc15",
      },
      {
        id: "fci",
        name: "FPT IS",
        category: "Outsourcing",
        jobs: 47,
        logo: "",
        logoColor: "#ea580c",
      },
    ],
  },
];

const totalCompanies = "2,300+";

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

  const { data: apiCosData } = useQuery({
    queryKey: ["public-companies"],
    queryFn: getPublicCompanies,
  });

  const pages = useMemo(() => {
    const normalizedStaticPages = staticPages.map((staticPage) => ({
      ...staticPage,
      companies: getCompactCompanies(staticPage.featured, staticPage.companies),
    }));

    if (!apiCosData || !apiCosData.items || apiCosData.items.length === 0) {
      return normalizedStaticPages;
    }

    const mapped: Company[] = apiCosData.items.map((co) => ({
      id: co.id,
      name: co.name,
      ...(co.slug ? { slug: co.slug } : {}),
      category: co.type || "Technology",
      jobs: 12,
      logo: co.logoUrl || co.logoFile?.publicUrl || "",
      logoColor: "#10b981",
    }));

    const result: CompanyPage[] = [];
    const PAGE_SIZE = COMPACT_COMPANIES_PER_PAGE + 1;
    const staticCos = staticPages.flatMap((p) => p.companies);

    for (let i = 0; i < mapped.length; i += PAGE_SIZE) {
      const chunk = mapped.slice(i, i + PAGE_SIZE);
      const first = chunk[0]!;
      const featured: FeaturedCompany = {
        ...first,
        logoColor: "#10b981",
        cover: "",
        tags: [first.category, "Partner"],
        description: apiCosData.items[i]?.description || "Công ty công nghệ đối tác tiêu biểu.",
      };

      result.push({
        featured,
        companies: getCompactCompanies(featured, chunk.slice(1), staticCos),
      });
    }

    return [...result, ...normalizedStaticPages];
  }, [apiCosData]);

  const page = pages[pageIndex] || staticPages[0]!;
  const totalPages = pages.length;

  const { data: featuredCompanyDetail } = useQuery({
    queryKey: ["public-featured-company-cover", page.featured.slug],
    queryFn: () => getPublicCompanyDetail(page.featured.slug!),
    enabled: Boolean(page.featured.slug && !page.featured.cover),
    staleTime: 5 * 60_000,
  });

  const featured = useMemo(
    () => ({
      ...page.featured,
      cover: featuredCompanyDetail?.coverFile?.publicUrl || page.featured.cover,
    }),
    [featuredCompanyDetail?.coverFile?.publicUrl, page.featured],
  );

  const cards = useMemo(() => page.companies.slice(0, visibleCount), [page, visibleCount]);

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
            {totalCompanies} công ty tuyển dụng
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
            followLoading={!isCompanyFollowsSessionResolved || isCompanyFollowPending(featured.id)}
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
        <p>{company.description}</p>
        <span className="featured-company-featured-jobs">
          <Briefcase size={15} />
          {company.jobs} việc làm đang tuyển
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
