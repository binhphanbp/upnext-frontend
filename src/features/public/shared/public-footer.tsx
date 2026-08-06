"use client";

import {
  CaretDown,
  Check,
  FacebookLogo,
  Globe,
  InstagramLogo,
  LinkedinLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { type MouseEvent as ReactMouseEvent, useEffect, useState } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

import { upnextLogo } from "../home/brand";

type PublicFooterProps = {
  navigate: (path: string) => void;
};

type FooterLink = {
  label: string;
  path: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

type FooterCopy = {
  description: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterPlaceholder: string;
  newsletterAria: string;
  subscribe: string;
  copyright: string;
  terms: string;
  privacy: string;
  languageLabel: string;
  homeLabel: string;
  columns: FooterColumn[];
  supportTitle: string;
  supportLinks: FooterLink[];
};

const socialLinks = [
  { label: "Facebook", icon: FacebookLogo, href: "https://www.facebook.com/" },
  { label: "LinkedIn", icon: LinkedinLogo, href: "https://www.linkedin.com/" },
  { label: "YouTube", icon: YoutubeLogo, href: "https://www.youtube.com/" },
  { label: "Instagram", icon: InstagramLogo, href: "https://www.instagram.com/" },
] as const;

const copyByLocale: Record<"vi" | "en", FooterCopy> = {
  vi: {
    description:
      "Nền tảng tuyển dụng IT kết nối ứng viên tài năng với các công ty công nghệ hàng đầu. Cơ hội phù hợp, sự nghiệp bứt phá.",
    newsletterTitle: "Nhận thông tin việc làm IT mới nhất",
    newsletterDescription: "Đăng ký nhận email để không bỏ lỡ cơ hội việc làm phù hợp với bạn.",
    newsletterPlaceholder: "Nhập email của bạn",
    newsletterAria: "Email nhận bản tin UpNext",
    subscribe: "Đăng ký",
    copyright: "Tất cả quyền được bảo lưu.",
    terms: "Điều khoản",
    privacy: "Bảo mật",
    languageLabel: "Tiếng Việt",
    homeLabel: "Trang chủ UpNext",
    columns: [
      {
        title: "Liên kết nhanh",
        links: [
          { label: "Tìm việc IT", path: "/jobs" },
          { label: "Công ty công nghệ", path: "/companies" },
          { label: "Tạo hồ sơ", path: "/register" },
          { label: "Tính năng", path: "/" },
          { label: "Bảng giá", path: "/portal-access" },
          { label: "Blog", path: "/" },
        ],
      },
      {
        title: "Nhà tuyển dụng",
        links: [
          { label: "Đăng tin tuyển dụng", path: "/recruiter/register" },
          { label: "Tìm hồ sơ", path: "/portal-access" },
          { label: "Giải pháp tuyển dụng", path: "/portal-access" },
          { label: "Bảng giá", path: "/portal-access" },
          { label: "Liên hệ", path: "/portal-access" },
        ],
      },
    ],
    supportTitle: "Hỗ trợ",
    supportLinks: [
      { label: "Trung tâm trợ giúp", path: "/portal-access" },
      { label: "Hướng dẫn sử dụng", path: "/portal-access" },
      { label: "Chính sách bảo mật", path: "/register" },
      { label: "Điều khoản sử dụng", path: "/register" },
    ],
  },
  en: {
    description:
      "The IT recruitment platform connecting talented candidates with leading technology companies. Better-fit opportunities, stronger careers.",
    newsletterTitle: "Get the latest IT jobs",
    newsletterDescription: "Subscribe by email so you do not miss roles that fit your profile.",
    newsletterPlaceholder: "Enter your email",
    newsletterAria: "UpNext newsletter email",
    subscribe: "Subscribe",
    copyright: "All rights reserved.",
    terms: "Terms",
    privacy: "Privacy",
    languageLabel: "English",
    homeLabel: "UpNext homepage",
    columns: [
      {
        title: "Quick links",
        links: [
          { label: "IT Jobs", path: "/jobs" },
          { label: "Tech companies", path: "/companies" },
          { label: "Create profile", path: "/register" },
          { label: "Features", path: "/" },
          { label: "Pricing", path: "/portal-access" },
          { label: "Blog", path: "/" },
        ],
      },
      {
        title: "Employers",
        links: [
          { label: "Post a Job", path: "/recruiter/register" },
          { label: "Find candidates", path: "/portal-access" },
          { label: "Hiring solutions", path: "/portal-access" },
          { label: "Pricing", path: "/portal-access" },
          { label: "Contact", path: "/portal-access" },
        ],
      },
    ],
    supportTitle: "Support",
    supportLinks: [
      { label: "Help Center", path: "/portal-access" },
      { label: "User Guide", path: "/portal-access" },
      { label: "Privacy Policy", path: "/register" },
      { label: "Terms of Service", path: "/register" },
    ],
  },
};

export function PublicFooter({ navigate }: PublicFooterProps) {
  const locale = useLocale() === "en" ? "en" : "vi";
  const router = useRouter();
  const pathname = usePathname();
  const [queryString, setQueryString] = useState("");
  const copy = copyByLocale[locale];
  const currentYear = new Date().getFullYear();
  const languageOptions = [
    { locale: "vi" as const, label: "Tiếng Việt" },
    { locale: "en" as const, label: "English" },
  ];

  function goTo(path: string) {
    router.prefetch(path);
    navigate(path);
  }

  useEffect(() => {
    setQueryString(window.location.search);
  }, [pathname]);

  function getLocaleHref(nextLocale: "vi" | "en") {
    return `/${nextLocale}${pathname === "/" ? "" : pathname}${queryString}`;
  }

  function handleLanguageLinkClick(
    event: ReactMouseEvent<HTMLAnchorElement>,
    nextLocale: "vi" | "en",
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    window.location.assign(
      `/${nextLocale}${pathname === "/" ? "" : pathname}${window.location.search}`,
    );
  }

  return (
    <footer id="site-footer" className="marketing-home-footer" aria-label="Footer UpNext">
      <section className="marketing-home-footer-main">
        <div className="marketing-home-footer-brand">
          <button
            type="button"
            className="marketing-home-footer-logo"
            onClick={() => goTo("/")}
            aria-label={copy.homeLabel}
          >
            <Image
              src={upnextLogo.wordmark}
              alt="UpNext"
              width={148}
              height={36}
              style={{ height: "auto", width: "auto" }}
            />
          </button>
          <p>{copy.description}</p>
          <div className="marketing-home-footer-socials">
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                >
                  <Icon size={20} weight="fill" />
                </a>
              );
            })}
          </div>
        </div>

        <nav className="marketing-home-footer-links" aria-label="Footer navigation">
          {copy.columns.map((column) => (
            <div key={column.title} className="marketing-home-footer-link-column">
              <h3>{column.title}</h3>
              <ul>
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <button type="button" onClick={() => goTo(link.path)}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="marketing-home-footer-contact">
          <h3>{copy.supportTitle}</h3>
          <ul>
            {copy.supportLinks.map((link) => (
              <li key={link.label}>
                <button type="button" onClick={() => goTo(link.path)}>
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          <h3 className="marketing-home-footer-newsletter-title">{copy.newsletterTitle}</h3>
          <p>{copy.newsletterDescription}</p>
          <form
            className="marketing-home-footer-newsletter"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              name="footer-email"
              placeholder={copy.newsletterPlaceholder}
              aria-label={copy.newsletterAria}
              suppressHydrationWarning
            />
            <button type="submit">{copy.subscribe}</button>
          </form>
        </div>
      </section>

      <section className="marketing-home-footer-bottom">
        <p>
          © {currentYear} UpNext. {copy.copyright}
        </p>
        <div className="marketing-home-footer-bottom-actions">
          <details className="marketing-home-footer-language-menu">
            <summary className="marketing-home-footer-language">
              <Globe size={14} />
              {copy.languageLabel}
              <CaretDown size={12} />
            </summary>
            <div className="marketing-home-footer-language-panel" role="menu">
              {languageOptions.map((item) => (
                <a
                  key={item.locale}
                  href={getLocaleHref(item.locale)}
                  onClick={(event) => handleLanguageLinkClick(event, item.locale)}
                  role="menuitemradio"
                  aria-checked={locale === item.locale}
                >
                  <span>{item.label}</span>
                  {locale === item.locale && <Check size={14} weight="bold" />}
                </a>
              ))}
            </div>
          </details>
          <button type="button" onClick={() => goTo("/register")}>
            {copy.terms}
          </button>
          <button type="button" onClick={() => goTo("/register")}>
            {copy.privacy}
          </button>
        </div>
      </section>
    </footer>
  );
}
