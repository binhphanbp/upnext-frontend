"use client";

import { useLocale } from "next-intl";
import Image from "next/image";

import { usePathname, useRouter } from "@/i18n/navigation";

import { upnextLogo } from "../home/brand";
import {
  ArrowRight,
  ArrowUp,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Facebook,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "../home/marketing-icons";

type PublicFooterProps = {
  navigate: (path: string) => void;
};

type FooterCopy = {
  ctaAria: string;
  ctaTitlePrefix: string;
  ctaHighlight: string;
  ctaTitleSuffix: string;
  ctaDescription: string;
  primary: string;
  secondary: string;
  brandDescription: string;
  quickLinks: string;
  contactTitle: string;
  contactDescription: string;
  emailPlaceholder: string;
  emailAria: string;
  subscribe: string;
  location: string;
  copyright: string;
  vietnamese: string;
  english: string;
  toTop: string;
  homeLabel: string;
};

const footerLinks = [
  { key: "jobs", vi: "Tìm việc IT", en: "IT jobs", path: "/jobs" },
  { key: "companies", vi: "Công ty công nghệ", en: "Tech companies", path: "/companies" },
  { key: "profile", vi: "Tạo hồ sơ", en: "Create profile", path: "/register" },
  { key: "career", vi: "Cẩm nang nghề nghiệp", en: "Career guide", path: "/jobs" },
  { key: "post", vi: "Đăng tuyển dụng", en: "Post a job", path: "/register" },
  { key: "talent", vi: "Tìm hồ sơ", en: "Find talent", path: "/register" },
  { key: "solutions", vi: "Giải pháp tuyển dụng", en: "Hiring solutions", path: "/register" },
  { key: "pricing", vi: "Bảng giá", en: "Pricing", path: "/register" },
  { key: "blog", vi: "Blog", en: "Blog", path: "/jobs" },
  { key: "help", vi: "Hướng dẫn", en: "Help center", path: "/register" },
  { key: "privacy", vi: "Chính sách bảo mật", en: "Privacy", path: "/register" },
  { key: "terms", vi: "Điều khoản sử dụng", en: "Terms", path: "/register" },
];

const footerSocials = [
  { label: "LinkedIn", icon: <Linkedin size={19} />, href: "https://www.linkedin.com/" },
  { label: "Facebook", icon: <Facebook size={19} />, href: "https://www.facebook.com/" },
  { label: "GitHub", icon: <Github size={19} />, href: "https://github.com/" },
  { label: "YouTube", icon: <Youtube size={19} />, href: "https://www.youtube.com/" },
];

const copyByLocale: Record<"vi" | "en", FooterCopy> = {
  vi: {
    ctaAria: "Bắt đầu hành trình sự nghiệp IT",
    ctaTitlePrefix: "Hành trình sự nghiệp IT",
    ctaHighlight: "tốt hơn",
    ctaTitleSuffix: "bắt đầu từ đây",
    ctaDescription: "Hàng nghìn cơ hội việc làm IT chất lượng đang chờ bạn khám phá.",
    primary: "Tìm việc ngay",
    secondary: "Tạo hồ sơ miễn phí",
    brandDescription:
      "Nền tảng tuyển dụng IT kết nối ứng viên tài năng với các công ty công nghệ hàng đầu. Cơ hội phù hợp, sự nghiệp bứt phá.",
    quickLinks: "Liên kết nhanh",
    contactTitle: "Liên hệ / Nhận tin",
    contactDescription: "Nhận thông tin việc làm IT mới nhất và các bài viết hữu ích từ UpNext.",
    emailPlaceholder: "Nhập email của bạn",
    emailAria: "Email nhận tin",
    subscribe: "Đăng ký",
    location: "TP. Hồ Chí Minh, Việt Nam",
    copyright: "© 2026 UpNext. Tất cả quyền được bảo lưu.",
    vietnamese: "Tiếng Việt",
    english: "English",
    toTop: "Lên đầu trang",
    homeLabel: "Trang chủ UpNext",
  },
  en: {
    ctaAria: "Start your IT career journey",
    ctaTitlePrefix: "A",
    ctaHighlight: "better",
    ctaTitleSuffix: "IT career journey starts here",
    ctaDescription: "Thousands of quality IT jobs are ready for you to explore.",
    primary: "Find jobs now",
    secondary: "Create free profile",
    brandDescription:
      "UpNext connects IT talent with trusted technology companies. Better fit, faster moves, stronger careers.",
    quickLinks: "Quick links",
    contactTitle: "Contact / Newsletter",
    contactDescription: "Get the latest IT jobs and useful career insights from UpNext.",
    emailPlaceholder: "Enter your email",
    emailAria: "Newsletter email",
    subscribe: "Subscribe",
    location: "Ho Chi Minh City, Vietnam",
    copyright: "© 2026 UpNext. All rights reserved.",
    vietnamese: "Tiếng Việt",
    english: "English",
    toTop: "Back to top",
    homeLabel: "UpNext homepage",
  },
};

function FlagIcon({ code }: { code: "VI" | "EN" }) {
  return (
    <span className={`marketing-home-lang-flag marketing-home-lang-flag-${code.toLowerCase()}`}>
      {code === "VI" ? (
        <svg aria-hidden="true" viewBox="0 0 22 16">
          <rect width="22" height="16" fill="#DA251D" rx="3" />
          <path
            fill="#FFDE00"
            d="m11 3.2 1.13 3.48h3.66l-2.96 2.15 1.13 3.47L11 10.15 8.04 12.3l1.13-3.47-2.96-2.15h3.66L11 3.2Z"
          />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 22 16">
          <clipPath id="upnext-footer-en-flag-clip">
            <rect width="22" height="16" rx="3" />
          </clipPath>
          <g clipPath="url(#upnext-footer-en-flag-clip)">
            <rect width="22" height="16" fill="#012169" />
            <path stroke="#fff" strokeWidth="3.2" d="m0 0 22 16M22 0 0 16" />
            <path stroke="#C8102E" strokeWidth="1.8" d="m0 0 22 16M22 0 0 16" />
            <path stroke="#fff" strokeWidth="5.2" d="M11 0v16M0 8h22" />
            <path stroke="#C8102E" strokeWidth="3.2" d="M11 0v16M0 8h22" />
          </g>
        </svg>
      )}
    </span>
  );
}

export function PublicFooter({ navigate }: PublicFooterProps) {
  const locale = useLocale() as "vi" | "en";
  const pathname = usePathname();
  const router = useRouter();
  const copy = copyByLocale[locale];

  function switchLanguage(nextLocale: "vi" | "en") {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <footer id="site-footer" className="marketing-home-footer" aria-label="Footer UpNext">
      <section className="marketing-home-footer-cta" aria-label={copy.ctaAria}>
        <span className="marketing-home-footer-cta-icon" aria-hidden="true">
          <BriefcaseBusiness size={34} />
        </span>
        <div className="marketing-home-footer-cta-copy">
          <h2>
            {copy.ctaTitlePrefix} <span>{copy.ctaHighlight}</span> {copy.ctaTitleSuffix}
          </h2>
          <p>{copy.ctaDescription}</p>
        </div>
        <div className="marketing-home-footer-cta-actions">
          <button
            type="button"
            className="marketing-home-footer-primary"
            onClick={() => navigate("/jobs")}
          >
            {copy.primary} <ArrowRight size={19} />
          </button>
          <button
            type="button"
            className="marketing-home-footer-secondary"
            onClick={() => navigate("/register")}
          >
            {copy.secondary}
          </button>
        </div>
      </section>

      <section className="marketing-home-footer-main">
        <div className="marketing-home-footer-brand">
          <button
            type="button"
            className="marketing-home-footer-logo"
            onClick={() => navigate("/")}
            aria-label={copy.homeLabel}
          >
            <Image
              src={upnextLogo.wordmark}
              alt="UpNext"
              width={164}
              height={39}
              style={{ height: "auto", width: "auto" }}
            />
          </button>
          <p>{copy.brandDescription}</p>
          <div className="marketing-home-footer-socials">
            {footerSocials.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        <nav className="marketing-home-footer-links" aria-label={copy.quickLinks}>
          <h3>{copy.quickLinks}</h3>
          <div className="marketing-home-footer-link-grid">
            {footerLinks.map((link) => (
              <button key={link.key} type="button" onClick={() => navigate(link.path)}>
                <span>{link[locale]}</span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </nav>

        <div className="marketing-home-footer-contact">
          <h3>{copy.contactTitle}</h3>
          <p>{copy.contactDescription}</p>
          <form
            className="marketing-home-footer-newsletter"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              name="footer-email"
              placeholder={copy.emailPlaceholder}
              aria-label={copy.emailAria}
              suppressHydrationWarning
            />
            <button type="submit">{copy.subscribe}</button>
          </form>
          <ul className="marketing-home-footer-contact-list">
            <li>
              <Mail size={18} />
              <span>contact@upnext.works</span>
            </li>
            <li>
              <Phone size={18} />
              <span>028 7303 2468</span>
            </li>
            <li>
              <MapPin size={18} />
              <span>{copy.location}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="marketing-home-footer-bottom">
        <p>{copy.copyright}</p>
        <div className="marketing-home-footer-bottom-actions">
          <button type="button" onClick={() => switchLanguage("vi")}>
            <FlagIcon code="VI" />
            {copy.vietnamese}
            <ChevronDown size={15} />
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => switchLanguage("en")}>
            <FlagIcon code="EN" />
            {copy.english}
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <ArrowUp size={18} />
            {copy.toTop}
          </button>
        </div>
      </section>
    </footer>
  );
}
