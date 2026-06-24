import { useMemo, useState } from "react";

import {
  ArrowRight,
  ArrowsClockwise,
  Check,
  CheckCircle,
  FileText,
  Sparkles,
  Target,
  WarningCircle,
  XCircle,
} from "./icons";
import { ProgressRing, TabHeader, profile } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

const mySkills = [
  "React",
  "TypeScript",
  "Next.js",
  "Redux",
  "Tailwind CSS",
  "Jest",
  "GraphQL",
  "Node.js",
];

const sampleJd = `Chúng tôi đang tìm Senior Frontend Developer:
- Thành thạo React, TypeScript, Next.js
- Kinh nghiệm với Redux, React Query và state management
- Hiểu biết về testing (Jest, React Testing Library, Cypress)
- Tối ưu hiệu năng web, Web Vitals, accessibility (a11y)
- Kinh nghiệm CI/CD, Docker là lợi thế
- Giao tiếp tiếng Anh tốt, làm việc với team quốc tế`;

const jdKeywords = [
  "React",
  "TypeScript",
  "Next.js",
  "Redux",
  "React Query",
  "Jest",
  "Cypress",
  "Web Vitals",
  "Accessibility",
  "CI/CD",
  "Docker",
  "Tiếng Anh",
];

type CompareProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function CompareTab({ goToTab }: CompareProps) {
  const [jd, setJd] = useState(sampleJd);
  const [result, setResult] = useState<null | {
    score: number;
    matched: string[];
    missing: string[];
  }>(null);
  const [loading, setLoading] = useState(false);

  const normalizedSkills = useMemo(() => mySkills.map((s) => s.toLowerCase()), []);

  function analyze() {
    setLoading(true);
    window.setTimeout(() => {
      const present = jd.toLowerCase();
      const relevant = jdKeywords.filter((kw) => present.includes(kw.toLowerCase()));
      const matched = relevant.filter((kw) =>
        normalizedSkills.some((s) => kw.toLowerCase().includes(s) || s.includes(kw.toLowerCase())),
      );
      const missing = relevant.filter((kw) => !matched.includes(kw));
      const score = relevant.length ? Math.round((matched.length / relevant.length) * 100) : 0;
      setResult({ score, matched, missing });
      setLoading(false);
    }, 700);
  }

  return (
    <>
      <TabHeader
        title="So sánh CV với JD"
        subtitle="Dán mô tả công việc để xem mức độ phù hợp và gợi ý cải thiện CV."
        actions={
          <button type="button" className="profile-v2-btn-ghost" onClick={() => goToTab("cv")}>
            <FileText size={16} /> Đổi CV phân tích
          </button>
        }
      />

      <div className="profile-v2-compare-grid">
        <article className="profile-v2-card profile-v2-panel">
          <header>
            <h2>
              <FileText size={18} /> CV đang dùng
            </h2>
            <span className="profile-v2-pill-muted">{profile.cv}</span>
          </header>
          <div className="profile-v2-compare-skills">
            <small>Kỹ năng trích xuất từ CV của bạn</small>
            <div className="profile-v2-tag-row">
              {mySkills.map((skill) => (
                <i key={skill}>{skill}</i>
              ))}
            </div>
          </div>

          <SectionLabel>
            <Target size={16} /> Mô tả công việc (JD)
          </SectionLabel>
          <textarea
            className="profile-v2-jd-input"
            value={jd}
            onChange={(event) => setJd(event.target.value)}
            placeholder="Dán nội dung mô tả công việc vào đây..."
            aria-label="Mô tả công việc"
            rows={10}
          />
          <button
            type="button"
            className="profile-v2-btn-primary profile-v2-compare-run"
            onClick={analyze}
            disabled={loading || jd.trim().length === 0}
          >
            {loading ? (
              <>
                <ArrowsClockwise size={16} className="profile-v2-spin" /> Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Phân tích mức độ phù hợp
              </>
            )}
          </button>
        </article>

        <article className="profile-v2-card profile-v2-panel profile-v2-compare-result">
          {!result ? (
            <div className="profile-v2-compare-placeholder">
              <span>
                <Target size={28} />
              </span>
              <strong>Kết quả phân tích sẽ hiển thị tại đây</strong>
              <p>
                Dán JD và bấm <b>Phân tích</b> để xem điểm phù hợp, kỹ năng khớp và những kỹ năng
                còn thiếu so với yêu cầu.
              </p>
            </div>
          ) : (
            <>
              <div className="profile-v2-compare-score">
                <ProgressRing value={result.score} size={150} />
                <div>
                  <strong>
                    {result.score >= 80
                      ? "Rất phù hợp"
                      : result.score >= 60
                        ? "Khá phù hợp"
                        : "Cần cải thiện"}
                  </strong>
                  <p>
                    CV của bạn khớp <b>{result.matched.length}</b>/
                    {result.matched.length + result.missing.length} yêu cầu chính trong JD.
                  </p>
                </div>
              </div>

              <div className="profile-v2-compare-cols">
                <div>
                  <SectionLabel className="is-ok">
                    <CheckCircle size={16} weight="fill" /> Kỹ năng khớp ({result.matched.length})
                  </SectionLabel>
                  <div className="profile-v2-tag-row">
                    {result.matched.length ? (
                      result.matched.map((kw) => (
                        <i key={kw} className="is-ok">
                          <Check size={12} weight="bold" /> {kw}
                        </i>
                      ))
                    ) : (
                      <small className="profile-v2-muted">Chưa có kỹ năng nào khớp.</small>
                    )}
                  </div>
                </div>
                <div>
                  <SectionLabel className="is-warn">
                    <WarningCircle size={16} weight="fill" /> Kỹ năng còn thiếu (
                    {result.missing.length})
                  </SectionLabel>
                  <div className="profile-v2-tag-row">
                    {result.missing.length ? (
                      result.missing.map((kw) => (
                        <i key={kw} className="is-warn">
                          <XCircle size={12} weight="fill" /> {kw}
                        </i>
                      ))
                    ) : (
                      <small className="profile-v2-muted">
                        Tuyệt vời! Bạn khớp toàn bộ yêu cầu.
                      </small>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-v2-compare-tips">
                <strong>
                  <Sparkles size={15} /> Gợi ý cải thiện
                </strong>
                <ul>
                  {result.missing.slice(0, 3).map((kw) => (
                    <li key={kw}>
                      Bổ sung kinh nghiệm hoặc dự án liên quan đến <b>{kw}</b> vào CV.
                    </li>
                  ))}
                  <li>Thêm số liệu định lượng cho thành tựu để tăng sức thuyết phục.</li>
                </ul>
              </div>

              <div className="profile-v2-compare-actions">
                <button
                  type="button"
                  className="profile-v2-btn-primary"
                  onClick={() => goToTab("cv")}
                >
                  Cập nhật CV ngay <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  className="profile-v2-btn-ghost"
                  onClick={() => setResult(null)}
                >
                  Phân tích lại
                </button>
              </div>
            </>
          )}
        </article>
      </div>
    </>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`profile-v2-section-label ${className}`}>{children}</div>;
}
