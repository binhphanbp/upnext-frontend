import {
  Article,
  Bell,
  Briefcase,
  Buildings,
  ChartLineUp,
  ChatCircleDots,
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
    icon: Briefcase,
    items: [
      { label: "Dashboard tuyển dụng", href: "/recruiter", icon: Gauge },
      {
        label: "Tin tuyển dụng",
        href: "/recruiter/job-posts",
        icon: Briefcase,
      },
      { label: "Ứng viên", href: "/recruiter/candidates", icon: Users },
      { label: "Phỏng vấn", href: "/recruiter/interviews", icon: Bell },
    ],
  },
  {
    label: "Công ty",
    icon: Buildings,
    items: [
      {
        label: "Hồ sơ công ty",
        href: "/recruiter/company-profile",
        icon: Buildings,
        children: [
          { label: "Thông tin chung", href: "/recruiter/company-profile" },
          { label: "Địa chỉ làm việc", href: "/recruiter/company-addresses" },
        ],
      },
      {
        label: "Đội ngũ & quyền",
        href: "/recruiter/team",
        icon: UsersThree,
        children: [
          { label: "Mời người dùng", href: "/recruiter/team/members" },
          { label: "Vai trò", href: "/recruiter/team/roles" },
        ],
      },
      { label: "Phân tích", href: "/recruiter/analytics", icon: ChartLineUp },
      { label: "Thanh toán", href: "/recruiter/billing", icon: CreditCard },
    ],
  },
  {
    label: "Tin nhắn",
    href: "/recruiter/messages",
    icon: ChatCircleDots,
    items: [],
  },
];

export const adminNavGroups: WorkspaceNavGroup[] = [
  {
    label: "overview.title",
    icon: Gauge,
    items: [{ label: "overview.platformStats", href: "/admin", icon: Gauge }],
  },
  {
    label: "userManagement.title",
    icon: UsersThree,
    items: [
      {
        label: "userManagement.employers",
        href: "/admin/users/recruiters",
        icon: IdentificationBadge,
      },
      { label: "userManagement.candidates", href: "/admin/users/candidates", icon: Users },
    ],
  },
  {
    label: "operationsAndContent.title",
    icon: Article,
    items: [
      { label: "operationsAndContent.companies", href: "/admin/users/employers", icon: Buildings },
      { label: "operationsAndContent.jobs", href: "/admin/content/jobs", icon: Briefcase },
      { label: "operationsAndContent.articles", href: "/admin/content/articles", icon: Article },
      {
        label: "operationsAndContent.moderation",
        href: "/admin/content/moderation",
        icon: ShieldCheck,
      },
      { label: "operationsAndContent.appeals", href: "/admin/appeals", icon: ShieldCheck },
      { label: "operationsAndContent.support", href: "/admin/content/support", icon: Headset },
    ],
  },
  {
    label: "financeAndBusiness.title",
    icon: Receipt,
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
    icon: Database,
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
  name: "Nhà tuyển dụng",
  roleLabel: "Nhà tuyển dụng",
  initials: "NTD",
};

export const adminIdentity: WorkspaceIdentity = {
  name: "Quản trị viên",
  roleLabel: "Quản trị viên",
  initials: "QTV",
};
