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
  MagnifyingGlass,
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
    label: "overview.title",
    items: [{ label: "overview.platformStats", href: "/admin", icon: Gauge }],
  },
  {
    label: "userManagement.title",
    items: [
      { label: "userManagement.employers", href: "/admin/users/employers", icon: Buildings },
      { label: "userManagement.candidates", href: "/admin/users/candidates", icon: Users },
    ],
  },
  {
    label: "operationsAndContent.title",
    items: [
      { label: "operationsAndContent.jobs", href: "/admin/content/jobs", icon: Briefcase },
      { label: "operationsAndContent.articles", href: "/admin/content/articles", icon: Article },
      {
        label: "operationsAndContent.moderation",
        href: "/admin/content/moderation",
        icon: ShieldCheck,
      },
      { label: "operationsAndContent.support", href: "/admin/content/support", icon: Headset },
    ],
  },
  {
    label: "financeAndBusiness.title",
    items: [
      { label: "financeAndBusiness.plans", href: "/admin/finance/plans", icon: Package },
      {
        label: "financeAndBusiness.transactions",
        href: "/admin/finance/transactions",
        icon: Receipt,
      },
    ],
  },
  {
    label: "systemAdmin.title",
    items: [
      { label: "systemAdmin.masterData", href: "/admin/system/master-data", icon: Database },
      { label: "systemAdmin.roles", href: "/admin/system/roles", icon: IdentificationBadge },
      { label: "systemAdmin.auditLog", href: "/admin/system/audit-log", icon: ListChecks },
      {
        label: "systemAdmin.searchKeywords",
        href: "/admin/system/search-keywords",
        icon: MagnifyingGlass,
      },
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
