"use client";

import { FacebookLogo, GithubLogo, LinkedinLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import Image from "next/image";

import { useRouter } from "@/i18n/navigation";

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
  newsletterPlaceholder: string;
  newsletterAria: string;
  subscribe: string;
  copyright: string;
  terms: string;
  privacy: string;
  homeLabel: string;
  columns: FooterColumn[];
};

const socialLinks = [
  { label: "X", icon: XLogo, href: "https://x.com/" },
  { label: "LinkedIn", icon: LinkedinLogo, href: "https://www.linkedin.com/" },
  { label: "Facebook", icon: FacebookLogo, href: "https://www.facebook.com/" },
  { label: "GitHub", icon: GithubLogo, href: "https://github.com/" },
  { label: "YouTube", icon: YoutubeLogo, href: "https://www.youtube.com/" },
] as const;

const copyByLocale: Record<"vi" | "en", FooterCopy> = {
  vi: {
    description:
      "Nền tảng tuyển dụng IT giúp ứng viên tìm đúng cơ hội và doanh nghiệp tiếp cận đúng nhân tài.",
    newsletterTitle: "Nhận mẹo nghề nghiệp IT mỗi tháng.",
    newsletterPlaceholder: "Nhập email của bạn",
    newsletterAria: "Email nhận bản tin UpNext",
    subscribe: "Đăng ký",
    copyright: "© 2026 UpNext. Tất cả quyền được bảo lưu.",
    terms: "Điều khoản sử dụng",
    privacy: "Chính sách bảo mật",
    homeLabel: "Trang chủ UpNext",
    columns: [
      {
        title: "Sản phẩm",
        links: [
          { label: "Tìm việc IT", path: "/jobs" },
          { label: "Công ty IT", path: "/companies" },
          { label: "Hồ sơ ứng viên", path: "/candidate/profile" },
          { label: "Việc đã ứng tuyển", path: "/candidate/applications" },
        ],
      },
      {
        title: "Giải pháp",
        links: [
          { label: "Dành cho ứng viên", path: "/jobs" },
          { label: "Dành cho nhà tuyển dụng", path: "/portal-access" },
          { label: "Đăng tuyển dụng", path: "/recruiter/register" },
          { label: "Quản lý tuyển dụng", path: "/recruiter" },
        ],
      },
      {
        title: "Tài nguyên",
        links: [
          { label: "Bài viết nghề nghiệp", path: "/jobs" },
          { label: "Chuẩn bị phỏng vấn", path: "/jobs" },
          { label: "Mức lương IT", path: "/jobs" },
          { label: "Trung tâm hỗ trợ", path: "/portal-access" },
        ],
      },
      {
        title: "Công ty",
        links: [
          { label: "Về UpNext", path: "/" },
          { label: "Liên hệ", path: "/portal-access" },
          { label: "Bảo mật", path: "/register" },
          { label: "Điều khoản", path: "/register" },
        ],
      },
    ],
  },
  en: {
    description:
      "The IT recruitment platform helping candidates find better-fit roles and companies reach stronger talent.",
    newsletterTitle: "Get IT career tips, once a month.",
    newsletterPlaceholder: "Enter your email",
    newsletterAria: "UpNext newsletter email",
    subscribe: "Subscribe",
    copyright: "© 2026 UpNext. All rights reserved.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    homeLabel: "UpNext homepage",
    columns: [
      {
        title: "Product",
        links: [
          { label: "IT Jobs", path: "/jobs" },
          { label: "Companies", path: "/companies" },
          { label: "Candidate Profile", path: "/candidate/profile" },
          { label: "Applications", path: "/candidate/applications" },
        ],
      },
      {
        title: "Solutions",
        links: [
          { label: "For IT Candidates", path: "/jobs" },
          { label: "For Employers", path: "/portal-access" },
          { label: "Post a Job", path: "/recruiter/register" },
          { label: "Hiring Workspace", path: "/recruiter" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Career Advice", path: "/jobs" },
          { label: "Interview Prep", path: "/jobs" },
          { label: "IT Salary Guide", path: "/jobs" },
          { label: "Help Center", path: "/portal-access" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About UpNext", path: "/" },
          { label: "Contact", path: "/portal-access" },
          { label: "Privacy", path: "/register" },
          { label: "Terms", path: "/register" },
        ],
      },
    ],
  },
};

export function PublicFooter({ navigate }: PublicFooterProps) {
  const locale = useLocale() === "en" ? "en" : "vi";
  const router = useRouter();
  const copy = copyByLocale[locale];

  function goTo(path: string) {
    router.prefetch(path);
    navigate(path);
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
              width={154}
              height={37}
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
          <h3>{copy.newsletterTitle}</h3>
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
        <p>{copy.copyright}</p>
        <div className="marketing-home-footer-bottom-actions">
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
