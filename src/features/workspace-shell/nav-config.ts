import {
  Archive,
  Article,
  Bell,
  Briefcase,
  Buildings,
  ChartLineUp,
  ChatCircleDots,
  CreditCard,
  Tag,
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
      { label: "Tổng quan tuyển dụng", href: "/recruiter", icon: Gauge },
      {
        label: "Tin tuyển dụng",
        href: "/recruiter/job-posts",
        icon: Briefcase,
      },
      {
        label: "Ứng viên",
        href: "/recruiter/candidates",
        icon: Users,
      },
      // Tách khỏi "Ứng viên" có chủ ý: mục đó là application-scoped (người đã
      // nộp hồ sơ), còn Kho CV là những ứng viên **chưa** ứng tuyển tin nào của
      // công ty, chỉ công khai hồ sơ cho phép liên hệ chủ động. Gộp hai thứ vào
      // một mục sẽ làm cả pricing lẫn UX sai.
      {
        label: "Tìm ứng viên",
        href: "/recruiter/talent-pool",
        icon: Archive,
      },
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
          { label: "Quản lý đánh giá", href: "/recruiter/company-reviews" },
          { label: "Điểm uy tín", href: "/recruiter/company-reputation" },
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
      { label: "Bảng giá gói", href: "/recruiter/pricing", icon: Tag },
      { label: "Gói dịch vụ & Thanh toán", href: "/recruiter/billing", icon: CreditCard },
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

      { label: "operationsAndContent.reports", href: "/admin/reports", icon: ShieldCheck },
    ],
  },
  {
    label: "financeAndBusiness.title",
    icon: Receipt,
    items: [
      { label: "financeAndBusiness.plans", href: "/admin/finance/plans", icon: Package },
      {
        label: "financeAndBusiness.paymentConfig",
        href: "/admin/finance/payment-config",
        icon: CreditCard,
      },
      {
        label: "financeAndBusiness.transactions",
        href: "/admin/finance/transactions",
        icon: Receipt,
        disabled: true,
      },
    ],
  },
  {
    label: "systemAdmin.title",
    icon: Database,
    items: [
      {
        label: "systemAdmin.masterData",
        href: "/admin/system/master-data",
        icon: Database,
        disabled: true,
      },
      {
        label: "systemAdmin.roles",
        href: "/admin/system/roles",
        icon: IdentificationBadge,
        disabled: true,
      },
      {
        label: "systemAdmin.auditLog",
        href: "/admin/system/audit-log",
        icon: ListChecks,
        disabled: true,
      },
      {
        label: "systemAdmin.searchKeywords",
        href: "/admin/system/search-keywords",
        icon: MagnifyingGlass,
        disabled: true,
      },
      {
        label: "operationsAndContent.support",
        href: "/admin/content/support",
        icon: Headset,
        disabled: true,
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
