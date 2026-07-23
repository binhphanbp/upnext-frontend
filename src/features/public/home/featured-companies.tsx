"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getPublicCompanies } from "./api";
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

type CompanyPage = {
  featured: FeaturedCompany;
  companies: Company[];
};

// Each "page" = one featured spotlight + 9 cards (the featured also appears as
// the first card, matching the reference). Arrows page between sets.
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
      className="rounded-lg object-contain p-1"
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
   - desktop (>1180px): full bento — featured + 8 cards
   - tablet (821-1180px): featured hidden, 6 small cards + slider
   - mobile (<=820px): featured only (0 small cards) + slider */
function useVisibleCount() {
  const getCount = () => {
    if (typeof window === "undefined") return 8;
    if (window.matchMedia("(max-width: 820px)").matches) return 0;
    if (window.matchMedia("(max-width: 1180px)").matches) return 6;
    return 8;
  };
  const [count, setCount] = useState(8);

  useEffect(() => {
    const update = () => setCount(getCount());
    update(); // Initialize count on mount
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export function FeaturedCompanies({ navigate }: FeaturedCompaniesProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const visibleCount = useVisibleCount();

  const { data: apiCosData } = useQuery({
    queryKey: ["public-companies"],
    queryFn: getPublicCompanies,
  });

  const pages = useMemo(() => {
    if (!apiCosData || !apiCosData.items || apiCosData.items.length === 0) {
      return staticPages;
    }

    const mapped = apiCosData.items.map((co) => ({
      id: co.id,
      name: co.name,
      category: co.type || "Technology",
      jobs: 12,
      logo: co.logoUrl || co.logoFile?.publicUrl || "",
      logoColor: "#10b981",
    }));

    const result: CompanyPage[] = [];
    const PAGE_SIZE = 11;
    const staticCos = staticPages.flatMap((p) => p.companies);

    for (let i = 0; i < mapped.length; i += PAGE_SIZE) {
      const chunk = mapped.slice(i, i + PAGE_SIZE);

      // Pad chunk up to 11 elements using static companies to avoid empty slots in the grid
      const paddedCompanies = [...chunk];
      for (const staticCo of staticCos) {
        if (paddedCompanies.length >= 11) break;
        if (!paddedCompanies.some((c) => c.id === staticCo.id)) {
          paddedCompanies.push(staticCo);
        }
      }

      const first = apiCosData.items[i]!;
      const featured: FeaturedCompany = {
        id: first.id,
        name: first.name,
        category: first.type || "Technology",
        jobs: 12,
        logo: first.logoUrl || first.logoFile?.publicUrl || "",
        logoColor: "#10b981",
        cover: "",
        tags: [first.type || "Technology", "Partner"],
        description: first.description || "Công ty công nghệ đối tác tiêu biểu.",
      };

      result.push({
        featured,
        companies: paddedCompanies,
      });
    }

    return [...result, ...staticPages];
  }, [apiCosData]);

  const page = pages[pageIndex] || staticPages[0]!;
  const totalPages = pages.length;

  const cards = useMemo(() => page.companies.slice(0, visibleCount), [page, visibleCount]);

  function toggleFollow(id: string) {
    setFollowing((current) => ({ ...current, [id]: !current[id] }));
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

      <div className="marketing-home-co-stage">
        <button
          type="button"
          className="marketing-home-co-arrow marketing-home-co-arrow-prev"
          aria-label="Trang trước"
          onClick={() => step(-1)}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="marketing-home-co-bento" key={pageIndex}>
          <FeaturedCard
            company={page.featured}
            following={following[`feat-${page.featured.id}`] ?? false}
            onFollow={() => toggleFollow(`feat-${page.featured.id}`)}
            navigate={navigate}
          />

          {cards.map((company) => (
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
              <button
                type="button"
                className={`featured-company-follow${following[company.id] ? " is-following" : ""}`}
                aria-pressed={following[company.id] ?? false}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFollow(company.id);
                }}
              >
                {following[company.id] ? (
                  <>
                    <Check size={14} /> Đang theo dõi
                  </>
                ) : (
                  "Theo dõi"
                )}
              </button>
            </article>
          ))}
        </div>

        <button
          type="button"
          className="marketing-home-co-arrow marketing-home-co-arrow-next"
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
  navigate,
}: {
  company: FeaturedCompany;
  following: boolean;
  onFollow: () => void;
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
          <button
            type="button"
            className={`featured-company-featured-follow${following ? " is-following" : ""}`}
            aria-pressed={following}
            onClick={onFollow}
          >
            {following ? (
              <>
                <Check size={15} /> Đang theo dõi
              </>
            ) : (
              <>
                <Plus size={15} /> Theo dõi
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
