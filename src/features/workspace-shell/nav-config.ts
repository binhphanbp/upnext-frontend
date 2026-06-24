import {
  Bell,
  Briefcase,
  Buildings,
  ChartLineUp,
  CreditCard,
  Gauge,
  GearSix,
  IdentificationBadge,
  ListChecks,
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
      { label: "Hồ sơ công ty", href: "/recruiter/settings", icon: Buildings },
      { label: "Đội ngũ & quyền", href: "/recruiter/team", icon: UsersThree },
      { label: "Phân tích", href: "/recruiter/analytics", icon: ChartLineUp },
      { label: "Thanh toán", href: "/recruiter/billing", icon: CreditCard },
    ],
  },
];

export const adminNavGroups: WorkspaceNavGroup[] = [
  {
    label: "Vận hành",
    items: [
      { label: "Thống kê nền tảng", href: "/admin", icon: Gauge },
      { label: "Kiểm duyệt", href: "/admin/moderation", icon: ShieldCheck, badge: "19" },
      { label: "Người dùng & tài chính", href: "/admin/users-finance", icon: CreditCard },
      { label: "Vai trò & phân quyền", href: "/admin/roles", icon: IdentificationBadge },
    ],
  },
  {
    label: "Tăng trưởng",
    items: [
      { label: "SEO Console", href: "/admin/seo", icon: ChartLineUp },
      { label: "Sales CRM", href: "/admin/sales", icon: UsersThree },
      { label: "Audit log", href: "/admin/audit-log", icon: ListChecks },
      { label: "Cài đặt", href: "/admin/settings", icon: GearSix },
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
