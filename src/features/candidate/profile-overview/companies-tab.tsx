import { useState } from "react";

import {
  ArrowRight,
  Bell,
  BellRinging,
  Briefcase,
  Building2,
  Check,
  Search,
  Star,
  UsersRound,
} from "./icons";
import { EmptyState, Logo, TabHeader, followedCompanies } from "./profile-overview-shared";
import type { FollowedCompany, NavHandler, TabKey } from "./profile-overview-shared";

type CompaniesProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function CompaniesTab({ navigate }: CompaniesProps) {
  const [list, setList] = useState<FollowedCompany[]>(followedCompanies);
  const [query, setQuery] = useState("");
  const [alertsOn, setAlertsOn] = useState<Record<string, boolean>>(
    Object.fromEntries(followedCompanies.map((c) => [c.name, true])),
  );

  const visible = list.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  function unfollow(name: string) {
    setList((items) => items.filter((c) => c.name !== name));
  }

  function toggleAlert(name: string) {
    setAlertsOn((state) => ({ ...state, [name]: !state[name] }));
  }

  const totalJobs = list.reduce((sum, c) => sum + c.openJobs, 0);

  return (
    <>
      <TabHeader
        title="Công ty đang theo dõi"
        subtitle={`Bạn đang theo dõi ${list.length} công ty với ${totalJobs} việc làm đang mở.`}
        actions={
          <button
            type="button"
            className="profile-v2-btn-primary"
            onClick={() => navigate("/companies")}
          >
            <Search size={16} /> Khám phá công ty
          </button>
        }
      />

      <div className="profile-v2-toolbar">
        <div className="profile-v2-search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm công ty đang theo dõi..."
            aria-label="Tìm công ty đang theo dõi"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Building2 size={26} />}
          title={list.length === 0 ? "Chưa theo dõi công ty nào" : "Không tìm thấy công ty"}
          desc={
            list.length === 0
              ? "Theo dõi công ty để nhận thông báo khi họ đăng tin tuyển dụng mới."
              : "Thử tìm với từ khóa khác."
          }
          actionLabel="Khám phá công ty"
          onAction={() => navigate("/companies")}
        />
      ) : (
        <div className="profile-v2-company-grid">
          {visible.map((company) => (
            <article key={company.name} className="profile-v2-card profile-v2-company-card">
              <div className="profile-v2-company-cover" />
              <div className="profile-v2-company-top">
                <Logo src={company.logo} fallback={company.name.slice(0, 3)} />
                <button
                  type="button"
                  className={`profile-v2-bell-toggle${alertsOn[company.name] ? " is-on" : ""}`}
                  aria-label="Bật/tắt thông báo"
                  onClick={() => toggleAlert(company.name)}
                >
                  {alertsOn[company.name] ? <BellRinging size={17} /> : <Bell size={17} />}
                </button>
              </div>
              <h3>{company.name}</h3>
              <p className="profile-v2-company-industry">{company.industry}</p>
              <div className="profile-v2-company-meta">
                <span>
                  <UsersRound size={14} /> {company.size}
                </span>
                <span>
                  <Star size={14} weight="fill" /> 4.{(company.name.length % 5) + 4}/5
                </span>
              </div>
              <div className="profile-v2-company-jobs">
                <Briefcase size={15} />
                <strong>{company.openJobs}</strong> việc làm đang mở
              </div>
              <div className="profile-v2-company-actions">
                <button
                  type="button"
                  className="profile-v2-btn-primary profile-v2-btn-sm"
                  onClick={() => navigate("/companies")}
                >
                  Xem việc làm <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="profile-v2-btn-ghost profile-v2-btn-sm"
                  onClick={() => unfollow(company.name)}
                >
                  <Check size={14} /> Đang theo dõi
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
