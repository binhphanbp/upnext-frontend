import { useMemo, useState } from "react";

import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Funnel,
  Heart,
  MapPin,
  Search,
  Trash,
  UsersRound,
} from "./icons";
import { profileJobs } from "./profile-jobs-data";
import { EmptyState, Logo, TabHeader } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

type SavedJobsProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

const filters = ["Tất cả", "Phù hợp nhất", "Sắp hết hạn", "Lương cao"];

export function SavedJobsTab({ navigate }: SavedJobsProps) {
  const initial = useMemo(() => profileJobs.slice(0, 6).map((job) => job.id), []);
  const [savedIds, setSavedIds] = useState<string[]>(initial);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tất cả");

  const savedJobs = profileJobs.filter((job) => savedIds.includes(job.id));
  const visible = savedJobs.filter((job) =>
    `${job.title} ${job.company}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function unsave(id: string) {
    setSavedIds((ids) => ids.filter((x) => x !== id));
  }

  return (
    <>
      <TabHeader
        title="Việc làm đã lưu"
        subtitle={`Bạn đang lưu ${savedJobs.length} việc làm. Ứng tuyển trước khi hết hạn nhé.`}
        actions={
          <button
            type="button"
            className="profile-v2-btn-primary"
            onClick={() => navigate("/jobs")}
          >
            <Search size={16} /> Tìm thêm việc làm
          </button>
        }
      />

      <div className="profile-v2-toolbar">
        <div className="profile-v2-search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm trong việc đã lưu..."
            aria-label="Tìm trong việc đã lưu"
          />
        </div>
        <div className="profile-v2-chip-row">
          <span className="profile-v2-chip-label">
            <Funnel size={14} /> Lọc:
          </span>
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`profile-v2-chip${activeFilter === filter ? " is-active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Heart size={26} />}
          title={savedJobs.length === 0 ? "Chưa lưu việc làm nào" : "Không tìm thấy kết quả"}
          desc={
            savedJobs.length === 0
              ? "Lưu lại những việc làm yêu thích để xem và ứng tuyển sau."
              : "Thử từ khóa khác hoặc bỏ bớt bộ lọc."
          }
          actionLabel="Khám phá việc làm"
          onAction={() => navigate("/jobs")}
        />
      ) : (
        <div className="profile-v2-saved-list">
          {visible.map((job) => (
            <article key={job.id} className="profile-v2-card profile-v2-saved-card">
              <button
                type="button"
                className="profile-v2-saved-body"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <Logo src={job.logo} fallback={job.company.slice(0, 3)} />
                <div className="profile-v2-saved-info">
                  <strong>{job.title}</strong>
                  <span className="profile-v2-saved-company">{job.company}</span>
                  <div className="profile-v2-saved-meta">
                    <em>
                      <MapPin size={13} /> {job.location}
                    </em>
                    <em>
                      <Briefcase size={13} /> {job.level}
                    </em>
                    <em>
                      <UsersRound size={13} /> {job.applicants} ứng viên
                    </em>
                  </div>
                  <div className="profile-v2-tag-row">
                    {job.tags.slice(0, 4).map((tag) => (
                      <i key={tag}>{tag}</i>
                    ))}
                  </div>
                </div>
                <div className="profile-v2-saved-side">
                  <strong className="profile-v2-saved-salary">{job.salary}</strong>
                  <small>{job.posted}</small>
                </div>
              </button>
              <div className="profile-v2-saved-actions">
                <button
                  type="button"
                  className="profile-v2-btn-primary profile-v2-btn-sm"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  Ứng tuyển ngay <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="profile-v2-icon-action"
                  aria-label="Bỏ lưu"
                  onClick={() => unsave(job.id)}
                >
                  <Bookmark size={17} weight="fill" />
                </button>
                <button
                  type="button"
                  className="profile-v2-icon-action profile-v2-icon-del"
                  aria-label="Xóa khỏi danh sách"
                  onClick={() => unsave(job.id)}
                >
                  <Trash size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
