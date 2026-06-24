import { useState } from "react";

import {
  ArrowRight,
  Bell,
  BellRinging,
  Briefcase,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash,
  WalletCards,
} from "./icons";
import { EmptyState, TabHeader, Toggle } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

type Alert = {
  id: string;
  keyword: string;
  location: string;
  salary: string;
  frequency: "Hàng ngày" | "Hàng tuần" | "Tức thời";
  newCount: number;
  active: boolean;
};

const initialAlerts: Alert[] = [
  {
    id: "al1",
    keyword: "Frontend Developer (React)",
    location: "Hà Nội",
    salary: "Từ 25 triệu",
    frequency: "Hàng ngày",
    newCount: 8,
    active: true,
  },
  {
    id: "al2",
    keyword: "ReactJS / NextJS",
    location: "TP. Hồ Chí Minh • Remote",
    salary: "Từ 30 triệu",
    frequency: "Tức thời",
    newCount: 5,
    active: true,
  },
  {
    id: "al3",
    keyword: "Frontend Lead",
    location: "Tất cả địa điểm",
    salary: "Từ 45 triệu",
    frequency: "Hàng tuần",
    newCount: 0,
    active: false,
  },
];

type AlertsProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function AlertsTab({ navigate, goToTab }: AlertsProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const totalNew = alerts.filter((a) => a.active).reduce((s, a) => s + a.newCount, 0);

  function toggle(id: string) {
    setAlerts((list) => list.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }

  function remove(id: string) {
    setAlerts((list) => list.filter((a) => a.id !== id));
  }

  return (
    <>
      <TabHeader
        title="Thông báo việc làm"
        subtitle="Tạo bộ lọc để nhận việc làm mới phù hợp ngay khi được đăng."
        actions={
          <button type="button" className="profile-v2-btn-primary">
            <Plus size={16} /> Tạo thông báo
          </button>
        }
      />

      {totalNew > 0 && (
        <div className="profile-v2-alert-banner">
          <span>
            <BellRinging size={20} weight="fill" />
          </span>
          <div>
            <strong>{totalNew} việc làm mới phù hợp với thông báo của bạn</strong>
            <small>Cập nhật gần nhất hôm nay. Xem ngay trước khi hết hạn.</small>
          </div>
          <button
            type="button"
            className="profile-v2-btn-primary profile-v2-btn-sm"
            onClick={() => navigate("/jobs")}
          >
            Xem việc mới <ArrowRight size={14} />
          </button>
        </div>
      )}

      {alerts.length === 0 ? (
        <EmptyState
          icon={<Bell size={26} />}
          title="Chưa có thông báo nào"
          desc="Tạo bộ lọc thông báo để không bỏ lỡ việc làm phù hợp."
          actionLabel="Tạo thông báo đầu tiên"
        />
      ) : (
        <div className="profile-v2-alert-list">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className={`profile-v2-card profile-v2-alert-card${alert.active ? "" : " is-off"}`}
            >
              <span className="profile-v2-alert-icon">
                <Briefcase size={20} />
                {alert.active && alert.newCount > 0 && (
                  <em className="profile-v2-alert-dot">{alert.newCount}</em>
                )}
              </span>
              <div className="profile-v2-alert-info">
                <strong>{alert.keyword}</strong>
                <div className="profile-v2-alert-meta">
                  <span>
                    <MapPin size={13} /> {alert.location}
                  </span>
                  <span>
                    <WalletCards size={13} /> {alert.salary}
                  </span>
                  <span className="profile-v2-alert-freq">
                    <BellRinging size={13} /> {alert.frequency}
                  </span>
                </div>
                {alert.active ? (
                  <small className="profile-v2-alert-status is-on">
                    <Check size={13} />{" "}
                    {alert.newCount > 0
                      ? `${alert.newCount} việc mới`
                      : "Đang bật • chưa có việc mới"}
                  </small>
                ) : (
                  <small className="profile-v2-alert-status is-off">Đã tạm tắt</small>
                )}
              </div>
              <div className="profile-v2-alert-actions">
                <Toggle
                  checked={alert.active}
                  onChange={() => toggle(alert.id)}
                  label={`Bật tắt thông báo ${alert.keyword}`}
                />
                <button type="button" aria-label="Sửa thông báo" className="profile-v2-icon-action">
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Xóa thông báo"
                  className="profile-v2-icon-action profile-v2-icon-del"
                  onClick={() => remove(alert.id)}
                >
                  <Trash size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="profile-v2-card profile-v2-panel profile-v2-alert-pref">
        <header>
          <h2>Kênh nhận thông báo</h2>
        </header>
        <div className="profile-v2-pref-list">
          <PrefRow title="Email" desc="binh.nguyen@gmail.com" defaultOn />
          <PrefRow title="Thông báo đẩy" desc="Trên trình duyệt và ứng dụng UpNext" defaultOn />
          <PrefRow title="Zalo / SMS" desc="Nhận tin nhắn việc làm khẩn" defaultOn={false} />
        </div>
        <button
          type="button"
          className="profile-v2-link-strong"
          onClick={() => goToTab("settings")}
        >
          Quản lý trong Cài đặt <ArrowRight size={14} />
        </button>
      </section>
    </>
  );
}

function PrefRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="profile-v2-pref-row">
      <div>
        <strong>{title}</strong>
        <small>{desc}</small>
      </div>
      <Toggle checked={on} onChange={setOn} label={`Bật tắt ${title}`} />
    </div>
  );
}
