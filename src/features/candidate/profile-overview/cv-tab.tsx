import { useState } from "react";

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  DotsThreeVertical,
  DownloadSimple,
  Eye,
  FileText,
  Pencil,
  Plus,
  ShareNetwork,
  Sparkles,
  Target,
  Trash,
  Upload,
  WarningCircle,
} from "./icons";
import { EmptyState, SectionTitle, TabHeader } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

type CvItem = {
  id: string;
  name: string;
  updated: string;
  size: string;
  source: "upload" | "builder";
  score: number;
  isDefault: boolean;
};

const initialCvs: CvItem[] = [
  {
    id: "cv-main",
    name: "Binh_Nguyen_Resume.pdf",
    updated: "02/05/2026",
    size: "1.2 MB",
    source: "upload",
    score: 86,
    isDefault: true,
  },
  {
    id: "cv-frontend",
    name: "Frontend_Developer_CV.pdf",
    updated: "18/04/2026",
    size: "980 KB",
    source: "builder",
    score: 78,
    isDefault: false,
  },
  {
    id: "cv-en",
    name: "Binh_Nguyen_English.pdf",
    updated: "02/03/2026",
    size: "1.1 MB",
    source: "upload",
    score: 71,
    isDefault: false,
  },
];

const cvTips = [
  { ok: true, text: "Có đầy đủ thông tin liên hệ và liên kết mạng xã hội." },
  { ok: true, text: "Sử dụng từ khóa kỹ thuật khớp với vị trí Frontend." },
  { ok: false, text: "Nên thêm số liệu định lượng cho thành tựu công việc." },
  { ok: false, text: "Mục tóm tắt còn dài, nên rút gọn dưới 3 dòng." },
];

const builderTemplates = [
  { name: "Minimal", tone: "blue", desc: "Gọn gàng, phù hợp mọi ngành" },
  { name: "Tech", tone: "violet", desc: "Nổi bật kỹ năng & dự án" },
  { name: "Professional", tone: "green", desc: "Trang trọng cho vị trí senior" },
];

type CvProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function CvTab({ goToTab }: CvProps) {
  const [cvs, setCvs] = useState(initialCvs);
  const defaultCv = cvs.find((cv) => cv.isDefault) ?? cvs[0];

  function setDefault(id: string) {
    setCvs((list) => list.map((cv) => ({ ...cv, isDefault: cv.id === id })));
  }

  function removeCv(id: string) {
    setCvs((list) => {
      const next = list.filter((cv) => cv.id !== id);
      if (next.length && !next.some((cv) => cv.isDefault)) {
        const first = next[0];
        if (first) {
          next[0] = { ...first, isDefault: true };
        }
      }
      return next;
    });
  }

  return (
    <>
      <TabHeader
        title="CV của tôi"
        subtitle="Quản lý, tải lên và tối ưu CV để ứng tuyển nhanh hơn."
        actions={
          <>
            <button type="button" className="profile-v2-btn-ghost">
              <Upload size={16} /> Tải CV lên
            </button>
            <button type="button" className="profile-v2-btn-primary">
              <Plus size={16} /> Tạo CV mới
            </button>
          </>
        }
      />

      <div className="profile-v2-cv-layout">
        <div className="profile-v2-cv-main">
          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>Danh sách CV ({cvs.length})</h2>
              <span className="profile-v2-pill-muted">{cvs.length}/5 CV</span>
            </header>

            {cvs.length === 0 ? (
              <EmptyState
                icon={<FileText size={26} />}
                title="Chưa có CV nào"
                desc="Tải CV lên hoặc tạo CV mới để bắt đầu ứng tuyển nhanh hơn."
                actionLabel="Tạo CV mới"
              />
            ) : (
              <div className="profile-v2-cv-files">
                {cvs.map((cv) => (
                  <div
                    key={cv.id}
                    className={`profile-v2-cv-row${cv.isDefault ? " is-default" : ""}`}
                  >
                    <span className="profile-v2-cv-thumb">
                      <FileText size={24} />
                    </span>
                    <div className="profile-v2-cv-info">
                      <strong>
                        {cv.name}
                        {cv.isDefault && (
                          <em className="profile-v2-cv-default">
                            <BadgeCheck size={13} weight="fill" /> Mặc định
                          </em>
                        )}
                        <em className="profile-v2-cv-source">
                          {cv.source === "builder" ? "Tạo trên UpNext" : "Tải lên"}
                        </em>
                      </strong>
                      <small>
                        Cập nhật {cv.updated} • {cv.size}
                      </small>
                    </div>
                    <div
                      className={`profile-v2-cv-score is-${cv.score >= 80 ? "high" : cv.score >= 70 ? "mid" : "low"}`}
                    >
                      <b>{cv.score}</b>
                      <span>điểm ATS</span>
                    </div>
                    <div className="profile-v2-cv-row-actions">
                      <button type="button" aria-label="Xem CV">
                        <Eye size={16} />
                      </button>
                      <button type="button" aria-label="Tải xuống">
                        <DownloadSimple size={16} />
                      </button>
                      <button type="button" aria-label="Chia sẻ">
                        <ShareNetwork size={16} />
                      </button>
                      {!cv.isDefault && (
                        <button
                          type="button"
                          className="profile-v2-cv-setdefault"
                          onClick={() => setDefault(cv.id)}
                        >
                          Đặt mặc định
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Xóa CV"
                        className="profile-v2-cv-del"
                        onClick={() => removeCv(cv.id)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <label className="profile-v2-upload-zone">
              <input type="file" accept=".pdf,.doc,.docx" aria-label="Tải CV lên" hidden />
              <Upload size={22} />
              <strong>Kéo thả hoặc bấm để tải CV lên</strong>
              <small>Hỗ trợ PDF, DOC, DOCX • Tối đa 5 MB</small>
            </label>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>
                <Sparkles size={18} /> Tạo CV với mẫu UpNext
              </h2>
            </header>
            <div className="profile-v2-template-grid">
              {builderTemplates.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  className={`profile-v2-template is-${tpl.tone}`}
                >
                  <span className="profile-v2-template-preview">
                    <i />
                    <i />
                    <i />
                  </span>
                  <strong>{tpl.name}</strong>
                  <small>{tpl.desc}</small>
                  <em>
                    Dùng mẫu này <ArrowRight size={13} />
                  </em>
                </button>
              ))}
            </div>
          </article>
        </div>

        <aside className="profile-v2-cv-side">
          <article className="profile-v2-card profile-v2-panel profile-v2-ats">
            <SectionTitle hint={defaultCv?.name}>Điểm ATS của CV mặc định</SectionTitle>
            <div className="profile-v2-ats-score">
              <div
                className="profile-v2-ats-gauge"
                style={{ ["--v" as string]: `${defaultCv?.score ?? 0}` }}
              >
                <strong>{defaultCv?.score ?? 0}</strong>
                <small>/ 100</small>
              </div>
              <p>
                CV của bạn <b>khá tốt</b>. Cải thiện thêm vài điểm để tăng tỷ lệ vượt qua vòng lọc
                tự động.
              </p>
            </div>
            <ul className="profile-v2-ats-tips">
              {cvTips.map((tip) => (
                <li key={tip.text} className={tip.ok ? "is-ok" : "is-warn"}>
                  {tip.ok ? (
                    <CheckCircle size={16} weight="fill" />
                  ) : (
                    <WarningCircle size={16} weight="fill" />
                  )}
                  {tip.text}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="profile-v2-btn-primary"
              onClick={() => goToTab("compare")}
            >
              <Target size={15} /> So sánh CV với JD
            </button>
          </article>

          <article className="profile-v2-card profile-v2-panel">
            <header>
              <h2>Tùy chọn nhanh</h2>
            </header>
            <div className="profile-v2-cv-quick">
              <button type="button">
                <Pencil size={16} /> Chỉnh sửa CV mặc định
              </button>
              <button type="button">
                <ShareNetwork size={16} /> Tạo liên kết chia sẻ
              </button>
              <button type="button">
                <DotsThreeVertical size={16} /> Cài đặt quyền riêng tư CV
              </button>
            </div>
          </article>
        </aside>
      </div>
    </>
  );
}
