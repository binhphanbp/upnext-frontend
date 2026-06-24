import {
  Article,
  Bell,
  Briefcase,
  Buildings,
  ChartLineUp,
  CreditCard,
  Database,
  Gauge,
  Headset,
  IdentificationBadge,
  ListChecks,
  Package,
  Receipt,
  ShieldCheck,
  Users,
  UsersThree,
} from "@phosphor-icons/react";

import type { WorkspaceIdentity, WorkspaceNavGroup } from "./types";

export const recruiterNavGroups: WorkspaceNavGroup[] = [
  {
    label: "Tuyển dụng",
    items: [
      { label: "Báo cáo tuyển dụng", href: "/recruiter", icon: Gauge },
      {
        label: "Tin tuyển dụng",
        href: "/recruiter/job-posts",
        icon: Briefcase,
        badge: "36",
      },
      { label: "Ứng viên", href: "/recruiter/candidates", icon: Users, badge: "1.2k" },
      { label: "Pipeline", href: "/recruiter/pipeline", icon: ListChecks, badge: "82" },
      { label: "Phỏng vấn", href: "/recruiter/interviews", icon: Bell, badge: "18" },
    ],
  },
  {
    label: "Công ty",
    items: [
      { label: "Hồ sơ công ty", href: "/recruiter/company-profile", icon: Buildings },
      { label: "Đội ngũ & quyền", href: "/recruiter/team", icon: UsersThree },
      { label: "Phân tích", href: "/recruiter/analytics", icon: ChartLineUp },
      { label: "Thanh toán", href: "/recruiter/billing", icon: CreditCard },
    ],
  },
];

export const adminNavGroups: WorkspaceNavGroup[] = [
  {
    label: "Tổng quan",
    items: [{ label: "Thống kê nền tảng", href: "/admin", icon: Gauge }],
  },
  {
    label: "Quản lý Người dùng",
    items: [
      { label: "Nhà tuyển dụng", href: "/admin/users/employers", icon: Buildings },
      { label: "Ứng viên", href: "/admin/users/candidates", icon: Users },
    ],
  },
  {
    label: "Vận hành & Nội dung",
    items: [
      { label: "Quản lý tin đăng", href: "/admin/content/jobs", icon: Briefcase },
      { label: "Quản lý bài viết", href: "/admin/content/articles", icon: Article },
      {
        label: "Kiểm duyệt nội dung",
        href: "/admin/content/moderation",
        icon: ShieldCheck,
      },
      { label: "Trung tâm hỗ trợ", href: "/admin/content/support", icon: Headset },
    ],
  },
  {
    label: "Tài chính & Kinh doanh",
    items: [
      { label: "Sales CRM", href: "/admin/finance/sales", icon: UsersThree },
      { label: "Gói dịch vụ", href: "/admin/finance/plans", icon: Package },
      { label: "Lịch sử giao dịch", href: "/admin/finance/transactions", icon: Receipt },
    ],
  },
  {
    label: "Quản trị Hệ thống",
    items: [
      { label: "Dữ liệu gốc", href: "/admin/system/master-data", icon: Database },
      { label: "Vai trò & Phân quyền", href: "/admin/system/roles", icon: IdentificationBadge },
      { label: "Audit Log", href: "/admin/system/audit-log", icon: ListChecks },
    ],
  },
];

export const recruiterIdentity: WorkspaceIdentity = {
  name: "Bình Nguyễn",
  roleLabel: "Nhà tuyển dụng",
  initials: "BN",
};

export const adminIdentity: WorkspaceIdentity = {
  name: "Bình Nguyễn",
  roleLabel: "Quản trị viên",
  initials: "BN",
};
