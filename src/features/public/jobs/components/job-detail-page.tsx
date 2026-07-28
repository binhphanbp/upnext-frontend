"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { checkAppliedJob } from "@/features/candidate/api/profile";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";
import { useCandidateSavedJobs } from "@/features/candidate/saved-jobs";
import { getCandidateSession } from "@/features/candidate/session";
import { formatRelativeTime } from "@/shared/lib/date";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { toast } from "@/shared/ui/toast";

import { getPublicJobs } from "../../home/api";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle,
  Clock,
  Coins,
  Eye,
  FileText,
  Globe,
  MapPin,
  Monitor,
  PaperPlaneTilt,
  ShareNetwork,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "../../home/marketing-icons";
import { PublicFooter } from "../../shared/public-footer";
import { PublicHeader } from "../../shared/public-header";
import { ApplyModal } from "./apply-modal";
import { jobs, type Job, formatJobSalaryDisplay } from "./jobs-page";

import "../jobs-page.css";

type PublicJobDetailPageProps = {
  path: string;
  navigate: (path: string) => void;
};

const responsibilities = [
  "Tham gia phát triển, bảo trì và tối ưu các ứng dụng Web/Mobile theo roadmap sản phẩm.",
  "Viết code sạch, có khả năng mở rộng và tuân thủ coding convention của dự án.",
  "Phối hợp với Product, Design, QA và Backend để hoàn thiện tính năng từ discovery đến release.",
  "Tham gia review code, viết unit test và xử lý lỗi phát sinh trong quá trình vận hành.",
  "Đề xuất cải tiến kỹ thuật để nâng chất lượng sản phẩm và hiệu suất hệ thống.",
];

const requirements = [
  "Nắm vững nền tảng lập trình, cấu trúc dữ liệu, OOP và quy trình phát triển phần mềm.",
  "Có kinh nghiệm thực tế với các công nghệ liên quan trong phần kỹ năng của tin tuyển dụng.",
  "Biết đọc hiểu tài liệu tiếng Anh chuyên ngành và chủ động trao đổi khi yêu cầu chưa rõ.",
  "Có tư duy sản phẩm, trách nhiệm với chất lượng đầu ra và khả năng làm việc nhóm tốt.",
  "Ưu tiên ứng viên từng làm việc với hệ thống có người dùng thật hoặc quy mô enterprise.",
];

const benefits = [
  {
    icon: <WalletCards size={20} />,
    desc: "Thu nhập cạnh tranh, thưởng hiệu quả 2 lần/năm",
  },
  {
    icon: <Monitor size={20} />,
    desc: "Làm việc linh hoạt: Hybrid, Remote hoặc tại văn phòng hiện đại",
  },
  {
    icon: <ShieldCheck size={20} />,
    desc: "Bảo hiểm sức khỏe cao cấp cho bản thân và gia đình",
  },
  {
    icon: <Globe size={20} />,
    desc: "Đào tạo & chứng chỉ quốc tế qua học viện nội bộ",
  },
  {
    icon: <TrendingUp size={20} />,
    desc: "Cơ hội thăng tiến và lộ trình phát triển rõ ràng",
  },
  {
    icon: <UsersRound size={20} />,
    desc: "Teambuilding, du lịch, thể thao và nhiều hoạt động nội bộ",
  },
];

const hiringSteps = [
  { title: "Ứng tuyển", desc: "Gửi CV ứng tuyển qua UpNext" },
  { title: "Sàng lọc hồ sơ", desc: "Nhà tuyển dụng xem xét và phản hồi" },
  { title: "Phỏng vấn", desc: "1-2 vòng chuyên môn & văn hóa" },
  { title: "Offer & Onboard", desc: "Nhận offer và hoàn tất thủ tục" },
];

const companyStats = [
  { value: "256", label: "Việc làm" },
  { value: "30.000+", label: "Nhân sự" },
  { value: "27+", label: "Quốc gia" },
];

function getCleanLeadText(html: string) {
  if (!html) return "";
  let text = html.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "");
  text = text.replace(/<[^>]*>/gi, "");
  return text.replace(/\s+/g, " ").trim();
}
function getCleanHtml(html: string) {
  if (!html) return "";
  let cleaned = html.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "");
  cleaned = cleaned.replace(/<details[^>]*>/gi, "").replace(/<\/details>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Mô tả công việc\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Yêu cầu ứng viên\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<li>\s*Quyền lợi\s*<\/li>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Mô tả công việc\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Yêu cầu ứng viên\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>\s*Quyền lợi\s*<\/p>/gi, "");
  return cleaned.trim();
}

function getCleanText(html: string) {
  if (!html) return "";
  let text = html.replace(/<summary[^>]*>([\s\S]*?)<\/summary>/gi, "");
  text = text.replace(/<[^>]*>/gi, "");
  return text.replace(/\s+/g, " ").trim();
}

function getJobId(path: string) {
  return decodeURIComponent(path.split("/").filter(Boolean)[1] ?? "");
}

function formatJobDetailDeadline(expiredAt?: string | null) {
  if (!expiredAt) {
    return { date: "Không giới hạn", remainingText: "Không giới hạn" };
  }

  const d = new Date(expiredAt);
  const time = d.getTime();
  if (Number.isNaN(time)) {
    return { date: "Chưa cập nhật", remainingText: "Chưa cập nhật" };
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const dateFormatted = `${day}/${month}/${year}`;

  const remainingMs = time - Date.now();
  if (remainingMs < 0) {
    return { date: dateFormatted, remainingText: "Đã hết hạn" };
  }

  const days = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return { date: dateFormatted, remainingText: `còn ${days} ngày` };
}

function LogoMark({ job, size = "normal" }: { job: Job; size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const className = `jobs-logo-mark${size === "large" ? " is-large" : ""}`;

  if (!job.logo || failed) {
    return (
      <span className={`${className} jobs-logo-fallback`} style={{ color: job.logoColor }}>
        {job.company.charAt(0)}
      </span>
    );
  }

  return (
    <span className={className}>
      <img
        src={job.logo}
        alt={`Logo ${job.company}`}
        width={size === "large" ? 72 : 48}
        height={size === "large" ? 72 : 48}
        className="size-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export function PublicJobDetailPage({ path, navigate }: PublicJobDetailPageProps) {
  const jobId = getJobId(path);
  const fallbackJob = jobs[0];
  if (!fallbackJob) {
    throw new Error("No jobs available for job detail page.");
  }

  const { data: apiJobsData } = useQuery({
    queryKey: ["public-jobs"],
    queryFn: getPublicJobs,
  });

  const jobsList = useMemo(() => {
    if (!apiJobsData) return jobs;

    const mapped: Job[] = apiJobsData.map((job) => {
      const isRemote =
        job.employmentType?.name.toLowerCase().includes("remote") ||
        job.title.toLowerCase().includes("remote");
      const isHighSalary =
        (job.salaryMin && job.salaryMin >= 30000000) ||
        (job.salaryMax && job.salaryMax >= 30000000);

      const categories: string[] = [];
      if (isRemote) categories.push("remote");
      if (isHighSalary) categories.push("high-salary");
      const categoryCode = job.jobCategory?.name.toLowerCase() || "";
      if (categoryCode.includes("frontend")) categories.push("frontend");
      if (categoryCode.includes("backend")) categories.push("backend");
      if (categoryCode.includes("mobile")) categories.push("mobile");
      if (categoryCode.includes("data") || categoryCode.includes("ai")) {
        categories.push("data-ai");
      }
      if (categoryCode.includes("devops")) categories.push("devops");
      if (categoryCode.includes("qa") || categoryCode.includes("test")) {
        categories.push("qa");
      }

      return {
        id: job.id,
        title: job.title,
        company: job.company?.name || "UpNext Partner",
        logo: job.company?.logoUrl || job.company?.logoFile?.publicUrl || "",
        logoColor: "#10b981",
        verified: true,
        salary: formatJobSalaryDisplay(job),
        location: job.jobPostLocations?.[0]?.jobLocation?.city || "Việt Nam",
        mode: job.employmentType?.name || "Full-time",
        level: job.experienceLevel?.name || "Middle",
        type: job.employmentType?.name || "Full-time",
        posted:
          job.publishedAt || (job as any).createdAt
            ? formatRelativeTime(job.publishedAt || (job as any).createdAt, "vi")
            : "Mới đăng",
        applicants: (job as any).numberOfRecruits ?? 5,
        tags:
          job.jobPostSkills && job.jobPostSkills.length > 0
            ? job.jobPostSkills.map((s) => s.skill.name)
            : ([job.jobCategory?.name, job.employmentType?.name, job.experienceLevel?.name].filter(
                Boolean,
              ) as string[]),
        description: job.description || "",
        categories,
        urgent: false,
        featured: false,
        requirements: job.requirements,
        benefits: job.benefits,
        expiredAt: job.expiredAt,
      };
    });

    return mapped;
  }, [apiJobsData]);

  const job = jobsList.find((item) => item.id === jobId) ?? fallbackJob;
  const deadlineInfo = formatJobDetailDeadline(job.expiredAt);
  const {
    isPending: isSavedJobPending,
    isSessionResolved: isSavedJobsSessionResolved,
    savedJobIds,
    toggleSaveJob,
  } = useCandidateSavedJobs();
  const { session } = useCandidateProfileWorkspace();
  const saved = savedJobIds.includes(job.id);

  const { data: appliedData } = useQuery({
    queryKey: ["check-applied-job", job.id, session?.user.id],
    queryFn: () => checkAppliedJob(session!.accessToken, job.id),
    enabled: Boolean(session && session.accessToken && job?.id),
  });

  const hasApplied = appliedData?.applied === true;
  const [isOpenApply, setIsOpenApply] = useState(false);

  const similarJobs = useMemo(() => {
    let filtered = jobsList.filter(
      (item) =>
        item.id !== job.id &&
        (item.categories.some((c) => job.categories.includes(c)) ||
          item.tags?.some((t) => job.tags?.includes(t)) ||
          item.level === job.level),
    );

    if (filtered.length < 4) {
      const remaining = jobsList.filter(
        (item) => item.id !== job.id && !filtered.some((f) => f.id === item.id),
      );
      filtered = [...filtered, ...remaining];
    }

    return filtered.slice(0, 4);
  }, [job, jobsList]);

  return (
    <main className="jobs-page job-detail-page">
      <PublicHeader navigate={navigate} />

      <section className="job-detail-shell">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: "Trang chủ", onClick: () => navigate("/") },
            { label: "Việc làm IT", onClick: () => navigate("/jobs") },
            { label: job.title },
          ]}
        />

        <section className="job-detail-layout">
          <article className="job-detail-main">
            <section className="job-detail-card job-detail-hero-card">
              <div className="job-detail-company-row">
                <LogoMark job={job} size="large" />
                <div>
                  <button
                    type="button"
                    className="job-detail-company-name"
                    onClick={() => navigate("/companies/fpt-software")}
                  >
                    {job.company}
                  </button>
                  <p>{job.categories.join(" • ")}</p>
                </div>
                {job.verified && (
                  <span className="job-detail-verified">
                    <ShieldCheck size={15} weight="fill" /> Đã xác thực
                  </span>
                )}
              </div>

              <div className="job-detail-title-row">
                <h1>{job.title}</h1>
                {(job.featured || job.urgent) && (
                  <span className={job.urgent ? "is-urgent" : ""}>
                    <Star size={14} weight="fill" />
                    {job.urgent ? "Tuyển gấp" : "Hot"}
                  </span>
                )}
              </div>

              <p className="job-detail-lead">{getCleanLeadText(job.description)}</p>

              <div className="job-detail-salary-row">
                <Coins size={24} weight="fill" />
                <strong>{job.salary}</strong>
                <i aria-hidden="true" />
                <span>Thỏa thuận theo năng lực</span>
              </div>

              <div className="job-detail-meta-grid">
                <InfoTile icon={<MapPin size={20} />} label="Địa điểm" value={job.location} />
                <InfoTile icon={<Monitor size={20} />} label="Hình thức" value={job.mode} />
                <InfoTile
                  icon={<BriefcaseBusiness size={20} />}
                  label="Cấp bậc"
                  value={job.level}
                />
                <InfoTile icon={<Clock size={20} />} label="Đăng tuyển" value={job.posted} />
              </div>

              <div className="job-detail-tags" aria-label="Kỹ năng liên quan">
                {job.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="job-detail-action-row">
                {hasApplied ? (
                  <button type="button" disabled className="is-applied">
                    <CheckCircle size={18} weight="fill" />
                    Đã ứng tuyển
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const session = getCandidateSession();
                      if (session) {
                        setIsOpenApply(true);
                      } else {
                        navigate(`/register?job=${job.id}`);
                      }
                    }}
                  >
                    <PaperPlaneTilt size={18} />
                    Ứng tuyển ngay
                  </button>
                )}
                <button
                  type="button"
                  className={saved ? "is-saved" : ""}
                  onClick={() => {
                    if (!toggleSaveJob(job.id)) {
                      toast.info("Vui lòng đăng nhập để lưu công việc yêu thích.");
                      navigate(`/login?redirect=/jobs/${job.id}`);
                    }
                  }}
                  disabled={!isSavedJobsSessionResolved || isSavedJobPending(job.id)}
                  aria-pressed={saved}
                >
                  <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                  {saved ? "Đã lưu" : "Lưu tin"}
                </button>
                <button type="button">
                  <ShareNetwork size={18} />
                  Chia sẻ
                </button>
              </div>
            </section>

            <section className="job-detail-card job-detail-section">
              <div className="job-detail-card-head mb-6">
                <span>
                  <FileText size={18} />
                </span>
                <h2>Thông tin tuyển dụng</h2>
              </div>
              <div>
                {/* Mô tả công việc */}
                <div className="pb-5">
                  <h3 className="mb-3 text-base font-bold text-slate-900">Mô tả công việc</h3>
                  {job.description && job.description.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text space-y-2 text-sm leading-relaxed text-slate-700"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.description) }}
                    />
                  ) : (
                    <div className="job-detail-rich-text text-sm leading-relaxed text-slate-700">
                      <BulletList items={responsibilities} />
                    </div>
                  )}
                </div>

                {/* Yêu cầu ứng viên */}
                <div className="border-t border-slate-100 py-5">
                  <h3 className="mb-3 text-base font-bold text-slate-900">Yêu cầu ứng viên</h3>
                  {job.requirements &&
                  job.requirements.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text space-y-2 text-sm leading-relaxed text-slate-700"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.requirements) }}
                    />
                  ) : (
                    <div className="job-detail-rich-text text-sm leading-relaxed text-slate-700">
                      <BulletList items={requirements} />
                    </div>
                  )}
                </div>

                {/* Quyền lợi */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="mb-3 text-base font-bold text-slate-900">Quyền lợi</h3>
                  {job.benefits && job.benefits.replace(/<[^>]*>/g, "").trim().length > 0 ? (
                    <div
                      className="job-detail-rich-text space-y-2 text-sm leading-relaxed text-slate-700"
                      dangerouslySetInnerHTML={{ __html: getCleanHtml(job.benefits) }}
                    />
                  ) : (
                    <div className="job-detail-rich-text text-sm leading-relaxed text-slate-700">
                      <BulletList items={benefits.map((b) => b.desc)} />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <DetailSection title="Kỹ năng & công nghệ">
              <div className="job-detail-skill-cloud">
                {Array.from(
                  new Set([
                    ...job.tags,
                    "Next.js",
                    "TypeScript",
                    "JavaScript",
                    "HTML5",
                    "CSS3",
                    "React Query",
                    "Tailwind CSS",
                    "Git",
                    "RESTful API",
                    "Docker",
                  ]),
                ).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </DetailSection>

            <section className="job-detail-card job-detail-similar-section">
              <div className="job-detail-card-head mb-6">
                <h2>Việc làm tương tự</h2>
              </div>
              <div className="job-detail-similar-grid">
                {similarJobs.map((item) => (
                  <div
                    key={item.id}
                    className="job-detail-similar-card"
                    onClick={() => navigate(`/jobs/${item.id}`)}
                  >
                    <LogoMark job={item} />
                    <div className="job-detail-similar-info">
                      <h3>{item.title}</h3>
                      <p>{item.company}</p>
                      <div className="job-detail-similar-meta">
                        <span className="job-detail-similar-badge">{item.location}</span>
                        <span className="job-detail-similar-badge is-salary">{item.salary}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <aside className="job-detail-aside">
            <section className="job-detail-card job-detail-ready-card">
              <h2>Sẵn sàng ứng tuyển?</h2>
              <p>Gia tăng cơ hội với hồ sơ nổi bật</p>
              {hasApplied ? (
                <button type="button" disabled className="is-applied">
                  <CheckCircle size={18} weight="fill" />
                  Đã ứng tuyển
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const session = getCandidateSession();
                    if (session) {
                      setIsOpenApply(true);
                    } else {
                      navigate(`/register?job=${job.id}`);
                    }
                  }}
                >
                  <PaperPlaneTilt size={18} />
                  Ứng tuyển ngay
                </button>
              )}
              <button type="button">
                <Coins size={18} />
                Xem lương phù hợp
              </button>
              <button
                type="button"
                className={saved ? "is-saved" : ""}
                onClick={() => {
                  if (!toggleSaveJob(job.id)) {
                    toast.info("Vui lòng đăng nhập để lưu công việc yêu thích.");
                    navigate(`/login?redirect=/jobs/${job.id}`);
                  }
                }}
                disabled={!isSavedJobsSessionResolved || isSavedJobPending(job.id)}
                aria-pressed={saved}
              >
                <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
                {saved ? "Đã lưu tin" : "Lưu tin"}
              </button>
              <div className="job-detail-deadline">
                Hạn nộp hồ sơ: <b>{deadlineInfo.date}</b>{" "}
                <span>({deadlineInfo.remainingText})</span>
              </div>
              <div className="job-detail-verified-box">
                <ShieldCheck size={20} weight="fill" />
                <span>
                  <b>Tin tuyển dụng đã xác thực</b>
                  <small>Thông tin được kiểm duyệt bởi UpNext</small>
                </span>
              </div>
            </section>

            <section className="job-detail-card job-detail-overview-card">
              <h2>Tổng quan công việc</h2>
              <InfoLine icon={<Coins size={17} />} label="Mức lương" value={job.salary} />
              <InfoLine icon={<MapPin size={17} />} label="Địa điểm" value={job.location} />
              <InfoLine icon={<BriefcaseBusiness size={17} />} label="Hình thức" value={job.mode} />
              <InfoLine
                icon={<UsersRound size={17} />}
                label="Ứng viên"
                value={`${job.applicants} lượt`}
              />
              <InfoLine icon={<Calendar size={17} />} label="Trạng thái" value="Đang nhận hồ sơ" />
              <InfoLine
                icon={<Star size={17} />}
                label="Ưu tiên"
                value={job.featured ? "Tin nổi bật" : "Tin thường"}
              />
            </section>

            <section className="job-detail-card job-detail-company-mini">
              <LogoMark job={job} />
              <div>
                <h2>{job.company}</h2>
                <p>Công nghệ thông tin & Dịch vụ phần mềm</p>
                <em>Top công ty</em>
              </div>
              <button type="button">
                <Bookmark size={15} /> Theo dõi công ty
              </button>
              <div className="job-detail-company-mini-stats">
                {companyStats.map((stat) => (
                  <span key={stat.label}>
                    <b>{stat.value}</b>
                    <small>{stat.label}</small>
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => navigate("/companies/fpt-software")}>
                Xem công ty <ArrowRight size={15} />
              </button>
            </section>

            <section className="job-detail-card job-detail-share-card">
              <h2>Chia sẻ công việc</h2>
              <p>Giới thiệu công việc hấp dẫn này đến bạn bè của bạn.</p>
              <div>
                <button type="button" aria-label="Sao chép liên kết">
                  <ShareNetwork size={17} />
                </button>
                <button type="button" aria-label="Chia sẻ qua Facebook">
                  f
                </button>
                <button type="button" aria-label="Chia sẻ qua LinkedIn">
                  in
                </button>
                <button type="button" aria-label="Chia sẻ qua Zalo">
                  Zalo
                </button>
                <button type="button" aria-label="Chia sẻ qua email">
                  @
                </button>
              </div>
            </section>
          </aside>
        </section>
      </section>

      <PublicFooter navigate={navigate} />

      {isOpenApply && (
        <ApplyModal isOpen={isOpenApply} onClose={() => setIsOpenApply(false)} job={job} />
      )}
    </main>
  );
}

function DetailSection({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="job-detail-card job-detail-section">
      <div className="job-detail-card-head">
        {icon && <span>{icon}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="job-detail-bullet-list">
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="job-detail-info-tile">
      {icon}
      <small>{label}</small>
      <b>{value}</b>
    </span>
  );
}

function InfoLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="job-detail-info-line">
      <div className="job-detail-info-icon">{icon}</div>
      <div className="job-detail-info-content items-start text-left">
        <span className="job-detail-info-label text-left">{label}</span>
        <b className="job-detail-info-value text-left">{value}</b>
      </div>
    </div>
  );
}
