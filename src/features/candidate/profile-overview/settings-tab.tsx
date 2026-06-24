import { useState } from "react";

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  Check,
  Eye,
  Globe,
  Lock,
  Plug,
  Power,
  ShieldCheck,
  SignOut,
  Trash,
  UserCircle,
  WalletCards,
} from "./icons";
import { TabHeader, Toggle, profile } from "./profile-overview-shared";
import type { NavHandler, TabKey } from "./profile-overview-shared";

const sections = [
  { key: "account", label: "Tài khoản", icon: <UserCircle size={18} /> },
  { key: "privacy", label: "Quyền riêng tư", icon: <Lock size={18} /> },
  { key: "notifications", label: "Thông báo", icon: <Bell size={18} /> },
  { key: "security", label: "Bảo mật", icon: <ShieldCheck size={18} /> },
  { key: "connections", label: "Kết nối", icon: <Plug size={18} /> },
] as const;

type SectionKey = (typeof sections)[number]["key"];

type SettingsProps = {
  navigate: NavHandler;
  goToTab: (tab: TabKey) => void;
};

export function SettingsTab({ navigate }: SettingsProps) {
  const [active, setActive] = useState<SectionKey>("account");

  return (
    <>
      <TabHeader
        title="Cài đặt"
        subtitle="Quản lý tài khoản, quyền riêng tư, thông báo và bảo mật của bạn."
      />

      <div className="profile-v2-settings-layout">
        <nav className="profile-v2-settings-nav" aria-label="Mục cài đặt">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={active === section.key ? "is-active" : ""}
              onClick={() => setActive(section.key)}
            >
              {section.icon}
              <span>{section.label}</span>
            </button>
          ))}
          <button
            type="button"
            className="profile-v2-settings-logout"
            onClick={() => navigate("/login")}
          >
            <SignOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </nav>

        <div className="profile-v2-settings-body">
          {active === "account" && <AccountSection />}
          {active === "privacy" && <PrivacySection />}
          {active === "notifications" && <NotificationsSection />}
          {active === "security" && <SecuritySection />}
          {active === "connections" && <ConnectionsSection />}
        </div>
      </div>
    </>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="profile-v2-card profile-v2-panel profile-v2-set-card">
      <header className="profile-v2-set-head">
        <div>
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
      </header>
      {children}
    </article>
  );
}

function Field({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <label className="profile-v2-field-input">
      <span>{label}</span>
      <input type={type} defaultValue={value} aria-label={label} />
    </label>
  );
}

function SwitchRow({
  title,
  desc,
  defaultOn,
}: {
  title: string;
  desc: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="profile-v2-switch-row">
      <div>
        <strong>{title}</strong>
        <small>{desc}</small>
      </div>
      <Toggle checked={on} onChange={setOn} label={`Bật tắt ${title}`} />
    </div>
  );
}

function AccountSection() {
  return (
    <>
      <Card title="Thông tin cá nhân" desc="Cập nhật thông tin hiển thị trên hồ sơ của bạn.">
        <div className="profile-v2-set-avatar">
          <span className="profile-v2-avatar-lg">BN</span>
          <div>
            <button type="button" className="profile-v2-btn-ghost profile-v2-btn-sm">
              <Camera size={15} /> Đổi ảnh
            </button>
            <small>JPG, PNG tối đa 2 MB</small>
          </div>
        </div>
        <div className="profile-v2-field-grid">
          <Field label="Họ và tên" value={profile.name} />
          <Field label="Chức danh" value={profile.title} />
          <Field label="Email" value={profile.email} type="email" />
          <Field label="Số điện thoại" value={profile.phone} type="tel" />
          <Field label="Địa điểm" value={profile.location} />
          <Field label="Mức lương mong muốn" value={profile.expectedSalary} />
        </div>
        <div className="profile-v2-set-foot">
          <button type="button" className="profile-v2-btn-primary">
            <Check size={16} /> Lưu thay đổi
          </button>
          <button type="button" className="profile-v2-btn-ghost">
            Hủy
          </button>
        </div>
      </Card>

      <Card title="Ngôn ngữ & khu vực" desc="Tùy chỉnh ngôn ngữ hiển thị và khu vực việc làm.">
        <div className="profile-v2-field-grid">
          <label className="profile-v2-field-input">
            <span>
              <Globe size={14} /> Ngôn ngữ
            </span>
            <select defaultValue="vi">
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="profile-v2-field-input">
            <span>
              <WalletCards size={14} /> Đơn vị tiền tệ
            </span>
            <select defaultValue="vnd">
              <option value="vnd">VND (đ)</option>
              <option value="usd">USD ($)</option>
            </select>
          </label>
        </div>
      </Card>
    </>
  );
}

function PrivacySection() {
  return (
    <>
      <Card title="Hiển thị hồ sơ" desc="Kiểm soát ai có thể xem hồ sơ và thông tin của bạn.">
        <SwitchRow
          title="Mở tìm việc"
          desc="Cho phép nhà tuyển dụng tìm thấy và liên hệ với bạn"
          defaultOn={profile.openToWork}
        />
        <SwitchRow
          title="Hiển thị hồ sơ công khai"
          desc="Hồ sơ của bạn xuất hiện trong kết quả tìm kiếm"
          defaultOn
        />
        <SwitchRow
          title="Ẩn với công ty hiện tại"
          desc="Ẩn hồ sơ khỏi Tiki và các công ty bạn chọn"
          defaultOn={false}
        />
        <SwitchRow
          title="Cho phép xem thông tin liên hệ"
          desc="Chỉ nhà tuyển dụng đã xác minh mới xem được email & SĐT"
          defaultOn
        />
      </Card>

      <Card title="Dữ liệu của bạn" desc="Quản lý dữ liệu cá nhân theo quy định bảo mật.">
        <div className="profile-v2-data-actions">
          <button type="button" className="profile-v2-data-btn">
            <Eye size={17} />
            <span>
              <strong>Xem dữ liệu đã thu thập</strong>
              <small>Thông tin UpNext lưu về bạn</small>
            </span>
            <ArrowRight size={15} />
          </button>
          <button type="button" className="profile-v2-data-btn is-danger">
            <Trash size={17} />
            <span>
              <strong>Xóa tài khoản</strong>
              <small>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu</small>
            </span>
            <ArrowRight size={15} />
          </button>
        </div>
      </Card>
    </>
  );
}

function NotificationsSection() {
  return (
    <Card title="Tùy chọn thông báo" desc="Chọn loại thông báo và kênh bạn muốn nhận.">
      <SwitchRow title="Việc làm phù hợp" desc="Gợi ý việc làm mới theo hồ sơ của bạn" defaultOn />
      <SwitchRow
        title="Cập nhật đơn ứng tuyển"
        desc="Khi nhà tuyển dụng xem hoặc phản hồi"
        defaultOn
      />
      <SwitchRow title="Lời mời phỏng vấn" desc="Thông báo ngay khi có lịch phỏng vấn" defaultOn />
      <SwitchRow
        title="Tin tức & cẩm nang"
        desc="Bài viết, sự kiện và mẹo nghề nghiệp"
        defaultOn={false}
      />
      <SwitchRow
        title="Email tổng hợp hàng tuần"
        desc="Tóm tắt hoạt động và việc làm nổi bật"
        defaultOn
      />
    </Card>
  );
}

function SecuritySection() {
  return (
    <>
      <Card title="Đổi mật khẩu" desc="Sử dụng mật khẩu mạnh và không dùng lại ở nơi khác.">
        <div className="profile-v2-field-grid is-single">
          <Field label="Mật khẩu hiện tại" value="" type="password" />
          <Field label="Mật khẩu mới" value="" type="password" />
          <Field label="Xác nhận mật khẩu mới" value="" type="password" />
        </div>
        <div className="profile-v2-set-foot">
          <button type="button" className="profile-v2-btn-primary">
            <Lock size={16} /> Cập nhật mật khẩu
          </button>
        </div>
      </Card>

      <Card title="Bảo mật nâng cao">
        <SwitchRow
          title="Xác thực 2 lớp (2FA)"
          desc="Yêu cầu mã xác thực khi đăng nhập từ thiết bị mới"
          defaultOn={false}
        />
        <div className="profile-v2-session">
          <div className="profile-v2-session-row">
            <span className="profile-v2-session-icon is-on">
              <Power size={16} />
            </span>
            <div>
              <strong>Chrome • Windows</strong>
              <small>Hà Nội, Việt Nam • Đang hoạt động</small>
            </div>
            <em className="profile-v2-session-current">Hiện tại</em>
          </div>
          <div className="profile-v2-session-row">
            <span className="profile-v2-session-icon">
              <Power size={16} />
            </span>
            <div>
              <strong>Safari • iPhone</strong>
              <small>TP. HCM • 2 ngày trước</small>
            </div>
            <button type="button" className="profile-v2-link-danger">
              Đăng xuất
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

function ConnectionsSection() {
  const connections = [
    { name: "Google", desc: "binh.nguyen@gmail.com", connected: true },
    { name: "LinkedIn", desc: "Đồng bộ kinh nghiệm & kết nối", connected: true },
    { name: "GitHub", desc: "Hiển thị dự án mã nguồn của bạn", connected: false },
  ];
  return (
    <Card title="Tài khoản liên kết" desc="Kết nối để đăng nhập nhanh và đồng bộ dữ liệu.">
      <div className="profile-v2-conn-list">
        {connections.map((conn) => (
          <div key={conn.name} className="profile-v2-conn-row">
            <span className="profile-v2-conn-icon">{conn.name.slice(0, 1)}</span>
            <div>
              <strong>{conn.name}</strong>
              <small>{conn.desc}</small>
            </div>
            {conn.connected ? (
              <button type="button" className="profile-v2-conn-on">
                <BadgeCheck size={14} weight="fill" /> Đã kết nối
              </button>
            ) : (
              <button type="button" className="profile-v2-btn-ghost profile-v2-btn-sm">
                Kết nối
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
