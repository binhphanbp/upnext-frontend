export type RecruiterPlanName = "Starter" | "Pro" | "Business";

export type RecruiterPlanStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

export type RecruiterResourceKey =
  | "aiJobWriting"
  | "candidateInvites"
  | "cvViews"
  | "jobBoosts"
  | "jobPosts"
  | "teamSeats";

export type RecruiterResourceTone = "blue" | "green" | "orange" | "purple" | "rose" | "teal";

export type RecruiterResource = {
  displayMode: "remaining" | "used";
  key: RecruiterResourceKey;
  label: string;
  limit: number;
  percentRemaining: number;
  percentUsed: number;
  remaining: number;
  tone: RecruiterResourceTone;
  unit: string;
  used: number;
};

export type RecruiterPlan = {
  autoRenew: boolean;
  cycleDays: number;
  daysRemaining: number;
  expiresAt: string;
  id: string;
  name: RecruiterPlanName;
  startedAt: string;
  status: RecruiterPlanStatus;
};

export type BillingTransaction = {
  amount: number;
  code: string;
  currency: "VND";
  id: string;
  invoiceUrl?: string;
  itemName: string;
  paidAt?: string;
  status: "FAILED" | "PAID" | "PENDING" | "REFUNDED";
  type: "PLAN_RENEWAL" | "PLAN_UPGRADE" | "RESOURCE_TOPUP";
  typeLabel: string;
};

export type ResourceTopup = {
  description: string;
  id: string;
  resourceKey: RecruiterResourceKey;
  name: string;
  price: number;
};

export type PricingPlan = {
  featured?: boolean;
  name: RecruiterPlanName;
  price: string;
  values: Record<string, string>;
};

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function createResource(
  input: Omit<RecruiterResource, "percentRemaining" | "percentUsed" | "remaining">,
): RecruiterResource {
  const remaining = Math.max(0, input.limit - input.used);

  return {
    ...input,
    percentRemaining: clampPercent((remaining / input.limit) * 100),
    percentUsed: clampPercent((input.used / input.limit) * 100),
    remaining,
  };
}

export const currentRecruiterPlan: RecruiterPlan = {
  autoRenew: false,
  cycleDays: 30,
  daysRemaining: 18,
  expiresAt: "30/06/2026",
  id: "plan-pro-june-2026",
  name: "Pro",
  startedAt: "01/06/2026",
  status: "ACTIVE",
};

export const recruiterResources: RecruiterResource[] = [
  createResource({
    displayMode: "remaining",
    key: "jobPosts",
    label: "Lượt đăng tin",
    limit: 20,
    tone: "green",
    unit: "lượt",
    used: 8,
  }),
  createResource({
    displayMode: "used",
    key: "jobBoosts",
    label: "Lượt đẩy tin",
    limit: 60,
    tone: "orange",
    unit: "lượt",
    used: 28,
  }),
  createResource({
    displayMode: "used",
    key: "cvViews",
    label: "Lượt xem CV",
    limit: 500,
    tone: "blue",
    unit: "lượt",
    used: 186,
  }),
  createResource({
    displayMode: "used",
    key: "candidateInvites",
    label: "Lượt mời ứng viên",
    limit: 100,
    tone: "teal",
    unit: "lượt",
    used: 42,
  }),
  createResource({
    displayMode: "used",
    key: "aiJobWriting",
    label: "AI viết tin",
    limit: 30,
    tone: "purple",
    unit: "lượt",
    used: 8,
  }),
  createResource({
    displayMode: "used",
    key: "teamSeats",
    label: "Thành viên",
    limit: 5,
    tone: "rose",
    unit: "slot",
    used: 4,
  }),
];

export const planBenefits = [
  "20 lượt đăng tin",
  "60 lượt đẩy tin",
  "500 lượt xem CV",
  "100 lượt mời ứng viên",
  "5 tài khoản thành viên",
  "Hỗ trợ ưu tiên",
] as const;

export const resourceAlerts = [
  {
    id: "cv-views-low",
    label: "Lượt xem CV còn 18%",
    progress: 37,
    tone: "orange",
  },
  {
    id: "plan-expires",
    label: "Gói Pro hết hạn sau 18 ngày",
    tone: "blue",
  },
  {
    id: "job-posts-low",
    label: "Lượt đăng tin còn 3 lượt",
    tone: "blue",
  },
] as const;

export const resourceTopups: ResourceTopup[] = [
  {
    description: "Dành cho nhu cầu đăng tin mới",
    id: "topup-job-posts",
    resourceKey: "jobPosts",
    name: "+5 lượt đăng tin",
    price: 99_000,
  },
  {
    description: "Tăng hiển thị tin tuyển dụng",
    id: "topup-job-boosts",
    resourceKey: "jobBoosts",
    name: "+20 lượt đẩy tin",
    price: 199_000,
  },
  {
    description: "Xem thông tin & CV ứng viên",
    id: "topup-cv-views",
    resourceKey: "cvViews",
    name: "+100 lượt xem CV",
    price: 299_000,
  },
  {
    description: "Tiếp cận ứng viên tiềm năng",
    id: "topup-candidate-invites",
    resourceKey: "candidateInvites",
    name: "+50 lượt mời ứng viên",
    price: 199_000,
  },
  {
    description: "Tạo tin tuyển dụng bằng AI",
    id: "topup-ai-writing",
    resourceKey: "aiJobWriting",
    name: "+10 lượt AI viết tin",
    price: 149_000,
  },
];

export const billingTransactions: BillingTransaction[] = [
  {
    amount: 1_200_000,
    code: "INV-202606-001",
    currency: "VND",
    id: "txn-202606-001",
    invoiceUrl: "/invoices/INV-202606-001.pdf",
    itemName: "Pro (30 ngày)",
    paidAt: "01/06/2026",
    status: "PAID",
    type: "PLAN_RENEWAL",
    typeLabel: "Gia hạn gói",
  },
  {
    amount: 299_000,
    code: "INV-202605-015",
    currency: "VND",
    id: "txn-202605-015",
    invoiceUrl: "/invoices/INV-202605-015.pdf",
    itemName: "+100 lượt xem CV",
    paidAt: "25/05/2026",
    status: "PAID",
    type: "RESOURCE_TOPUP",
    typeLabel: "Mua thêm CV",
  },
  {
    amount: 700_000,
    code: "INV-202604-012",
    currency: "VND",
    id: "txn-202604-012",
    invoiceUrl: "/invoices/INV-202604-012.pdf",
    itemName: "Basic → Pro",
    paidAt: "28/04/2026",
    status: "PAID",
    type: "PLAN_UPGRADE",
    typeLabel: "Nâng cấp gói",
  },
  {
    amount: 199_000,
    code: "INV-202603-008",
    currency: "VND",
    id: "txn-202603-008",
    invoiceUrl: "/invoices/INV-202603-008.pdf",
    itemName: "+20 lượt đẩy tin",
    paidAt: "15/03/2026",
    status: "PAID",
    type: "RESOURCE_TOPUP",
    typeLabel: "Mua thêm đẩy tin",
  },
  {
    amount: 499_000,
    code: "INV-202603-001",
    currency: "VND",
    id: "txn-202603-001",
    invoiceUrl: "/invoices/INV-202603-001.pdf",
    itemName: "Basic (30 ngày)",
    paidAt: "01/03/2026",
    status: "PAID",
    type: "PLAN_RENEWAL",
    typeLabel: "Gia hạn gói",
  },
];

export const pricingRows = [
  "Lượt đăng tin",
  "Lượt đẩy tin",
  "Lượt xem CV",
  "Lượt mời ứng viên",
  "AI viết tin",
  "Thành viên",
  "Hỗ trợ ưu tiên",
] as const;

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "499.000đ",
    values: {
      "AI viết tin": "5 lượt",
      "Hỗ trợ ưu tiên": "Không",
      "Lượt xem CV": "150 lượt",
      "Lượt mời ứng viên": "30 lượt",
      "Lượt đăng tin": "8 lượt",
      "Lượt đẩy tin": "20 lượt",
      "Thành viên": "2 tài khoản",
    },
  },
  {
    featured: true,
    name: "Pro",
    price: "1.200.000đ",
    values: {
      "AI viết tin": "30 lượt",
      "Hỗ trợ ưu tiên": "Có",
      "Lượt xem CV": "500 lượt",
      "Lượt mời ứng viên": "100 lượt",
      "Lượt đăng tin": "20 lượt",
      "Lượt đẩy tin": "60 lượt",
      "Thành viên": "5 tài khoản",
    },
  },
  {
    name: "Business",
    price: "Liên hệ",
    values: {
      "AI viết tin": "Không giới hạn",
      "Hỗ trợ ưu tiên": "SLA riêng",
      "Lượt xem CV": "2.000 lượt",
      "Lượt mời ứng viên": "500 lượt",
      "Lượt đăng tin": "80 lượt",
      "Lượt đẩy tin": "250 lượt",
      "Thành viên": "20 tài khoản",
    },
  },
];
