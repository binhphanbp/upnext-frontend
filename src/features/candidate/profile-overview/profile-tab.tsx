import Image from "next/image";
import { useState } from "react";

import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Camera,
  Code2,
  DownloadSimple,
  Eye,
  GraduationCap,
  LinkIcon,
  MapPin,
  Medal,
  NotePencil,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Target,
  WalletCards,
} from "./icons";
import {
  Checklist,
  ProgressRing,
  SectionTitle,
  TabHeader,
  profile,
} from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

const skills = [
  { name: "React", level: 92 },
  { name: "TypeScript", level: 88 },
  { name: "Next.js", level: 80 },
  { name: "Redux", level: 75 },
  { name: "Tailwind CSS", level: 85 },
  { name: "Node.js", level: 64 },
  { name: "GraphQL", level: 58 },
  { name: "Jest", level: 70 },
];

const experiences = [
  {
    role: "Frontend Developer",
    company: "Tiki",
    logo: "/assets/marketing/home/companies/tiki.png",
    period: "06/2023 - Hiện tại",
    location: "Hà Nội",
    points: [
      "Xây dựng và tối ưu giao diện trang sản phẩm phục vụ hơn 2 triệu người dùng/ngày.",
      "Dẫn dắt việc chuẩn hóa design system, giảm 30% thời gian phát triển tính năng mới.",
      "Cải thiện điểm Lighthouse từ 68 lên 94 thông qua tối ưu hiệu năng.",
    ],
  },
  {
    role: "Junior Frontend Developer",
    company: "VNG Corporation",
    logo: "/assets/marketing/home/companies/vng.png",
    period: "03/2021 - 05/2023",
    location: "Hà Nội",
    points: [
      "Phát triển các module quản trị nội bộ bằng React và TypeScript.",
      "Phối hợp cùng team backend xây dựng tích hợp REST/GraphQL API.",
    ],
  },
];

const projects = [
  {
    name: "UpNext Candidate Portal",
    desc: "Cổng ứng viên với tìm việc theo AI, theo dõi ứng tuyển và quản lý CV.",
    tags: ["React", "TypeScript", "Vite"],
    link: "github.com/binhnguyen/upnext-portal",
  },
  {
    name: "Realtime Analytics Dashboard",
    desc: "Dashboard theo dõi chỉ số kinh doanh theo thời gian thực với WebSocket.",
    tags: ["Next.js", "Recharts", "WebSocket"],
    link: "github.com/binhnguyen/realtime-dash",
  },
];

const educations = [
  {
    school: "Đại học Bách Khoa Hà Nội",
    degree: "Kỹ sư Công nghệ thông tin",
    period: "2017 - 2021",
    note: "GPA 3.6/4.0 • Tốt nghiệp loại Giỏi",
  },
];

const certificates = [
  { name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", year: "2024" },
  { name: "Meta Front-End Developer", issuer: "Coursera", year: "2023" },
];

const languages = [
  { name: "Tiếng Việt", level: "Bản ngữ", value: 100 },
  { name: "Tiếng Anh", level: "TOEIC 850 • Thành thạo", value: 85 },
];

const profileTasks = [
  { label: "Thông tin cá nhân", done: true },
  { label: "Kỹ năng", done: true },
  { label: "Kinh nghiệm", done: true },
  { label: "Dự án", done: true },
  { label: "Mức lương mong muốn", done: false },
];

type ProfileProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function ProfileTab({ navigate, goToTab }: ProfileProps) {
  const [open, setOpen] = useState(profile.openToWork);

  return (
    <>
      <TabHeader
        title="Hồ sơ của tôi"
        subtitle="Quản lý thông tin nghề nghiệp để nhà tuyển dụng hiểu rõ về bạn."
        actions={
          <>
            <button type="button" className="profile-v2-btn-ghost" onClick={() => goToTab("cv")}>
              <Eye size={16} /> Xem CV
            </button>
            <button type="button" className="profile-v2-btn-primary">
              <NotePencil size={16} /> Chỉnh sửa hồ sơ
            </button>
          </>
        }
      />

      <section className="profile-v2-identity-card profile-v2-card">
        <div className="profile-v2-identity-cover" />
        <div className="profile-v2-identity-body">
          <div className="profile-v2-identity-avatar">
            <span>BN</span>
            <button type="button" aria-label="Đổi ảnh đại diện">
              <Camera size={15} />
            </button>
          </div>
          <div className="profile-v2-identity-main">
            <div className="profile-v2-identity-name">
              <h2>
                {profile.name}
                <BadgeCheck size={20} weight="fill" />
              </h2>
              <p>{profile.title}</p>
              <ul>
                <li>
                  <MapPin size={15} /> {profile.location}
                </li>
                <li>
                  <Briefcase size={15} /> {profile.level}
                </li>
                <li>
                  <WalletCards size={15} /> Mong muốn {profile.expectedSalary}
                </li>
              </ul>
            </div>
            <div className="profile-v2-identity-side">
              <label className={`profile-v2-open-badge${open ? " is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={open}
                  onChange={(event) => setOpen(event.target.checked)}
                  aria-label="Trạng thái mở tìm việc"
                />
                <span className="profile-v2-open-dot" />
                {open ? "Đang mở tìm việc" : "Tạm ẩn hồ sơ"}
              </label>
              <button
                type="button"
                className="profile-v2-link-strong"
                onClick={() => goToTab("compare")}
              >
                <Target size={15} /> So sánh CV với JD
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-v2-profile-grid">
        <div className="profile-v2-profile-main">
          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>Giới thiệu bản thân</h2>
              <button type="button">
                <Pencil size={14} /> Sửa
              </button>
            </header>
            <p className="profile-v2-about">
              Frontend Developer với hơn 3 năm kinh nghiệm xây dựng sản phẩm web quy mô lớn bằng
              React và TypeScript. Đam mê tối ưu hiệu năng, trải nghiệm người dùng và xây dựng
              design system bền vững. Mong muốn tham gia môi trường product để tạo ra sản phẩm có
              tác động thực sự.
            </p>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>
                <Code2 size={18} /> Kỹ năng chuyên môn
              </h2>
              <button type="button">
                <Plus size={14} /> Thêm
              </button>
            </header>
            <div className="profile-v2-skill-grid">
              {skills.map((skill) => (
                <div key={skill.name} className="profile-v2-skill">
                  <div>
                    <strong>{skill.name}</strong>
                    <span>{skill.level}%</span>
                  </div>
                  <i>
                    <em style={{ width: `${skill.level}%` }} />
                  </i>
                </div>
              ))}
            </div>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>
                <Briefcase size={18} /> Kinh nghiệm làm việc
              </h2>
              <button type="button">
                <Plus size={14} /> Thêm
              </button>
            </header>
            <div className="profile-v2-timeline">
              {experiences.map((exp) => (
                <div key={`${exp.role}-${exp.company}`} className="profile-v2-timeline-item">
                  <span className="profile-v2-timeline-logo">
                    <Image src={exp.logo} alt="" width={44} height={44} />
                  </span>
                  <div className="profile-v2-timeline-body">
                    <div className="profile-v2-timeline-head">
                      <div>
                        <strong>{exp.role}</strong>
                        <span>{exp.company}</span>
                      </div>
                      <em>{exp.period}</em>
                    </div>
                    <small className="profile-v2-timeline-loc">
                      <MapPin size={13} /> {exp.location}
                    </small>
                    <ul>
                      {exp.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>
                <Sparkles size={18} /> Dự án nổi bật
              </h2>
              <button type="button">
                <Plus size={14} /> Thêm
              </button>
            </header>
            <div className="profile-v2-project-grid">
              {projects.map((project) => (
                <div key={project.name} className="profile-v2-project">
                  <strong>{project.name}</strong>
                  <p>{project.desc}</p>
                  <div className="profile-v2-tag-row">
                    {project.tags.map((tag) => (
                      <em key={tag}>{tag}</em>
                    ))}
                  </div>
                  <a href={`https://${project.link}`} target="_blank" rel="noreferrer">
                    <LinkIcon size={13} /> {project.link}
                  </a>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="profile-v2-profile-side">
          <article className="profile-v2-card profile-v2-panel profile-v2-strength">
            <SectionTitle hint="Còn 1 mục">Độ mạnh hồ sơ</SectionTitle>
            <div className="profile-v2-strength-ring">
              <ProgressRing value={profile.completion} size={132} />
            </div>
            <Checklist tasks={profileTasks} />
            <button type="button" className="profile-v2-btn-primary" onClick={() => goToTab("cv")}>
              Bổ sung mức lương <ArrowRight size={15} />
            </button>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>
                <GraduationCap size={18} /> Học vấn
              </h2>
            </header>
            <div className="profile-v2-edu-list">
              {educations.map((edu) => (
                <div key={edu.school} className="profile-v2-edu">
                  <strong>{edu.school}</strong>
                  <span>{edu.degree}</span>
                  <em>{edu.period}</em>
                  <small>{edu.note}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>
                <Medal size={18} /> Chứng chỉ
              </h2>
            </header>
            <div className="profile-v2-cert-list">
              {certificates.map((cert) => (
                <div key={cert.name} className="profile-v2-cert">
                  <span>
                    <Star size={15} weight="fill" />
                  </span>
                  <div>
                    <strong>{cert.name}</strong>
                    <small>
                      {cert.issuer} • {cert.year}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>Ngôn ngữ</h2>
            </header>
            <div className="profile-v2-lang-list">
              {languages.map((lang) => (
                <div key={lang.name} className="profile-v2-skill">
                  <div>
                    <strong>{lang.name}</strong>
                    <span>{lang.level}</span>
                  </div>
                  <i>
                    <em style={{ width: `${lang.value}%` }} />
                  </i>
                </div>
              ))}
            </div>
          </article>

          <button
            type="button"
            className="profile-v2-card profile-v2-side-cta"
            onClick={() => navigate("/candidate/profile")}
          >
            <DownloadSimple size={18} />
            Tải hồ sơ dạng PDF
          </button>
        </aside>
      </div>
    </>
  );
}
