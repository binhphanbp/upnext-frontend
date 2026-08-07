import { apiRequest } from "@/shared/api/http";

/** Metered features a plan can grant. Mirrors the backend SubscriptionFeature enum. */
export const SUBSCRIPTION_FEATURES = [
  "JOB_POST",
  "FEATURED_JOB",
  "URGENT_LABEL",
  "CV_POOL_VIEW",
  "TALENT_CONTACT",
  "AI_CV_MATCHING",
  "AI_JD_GENERATE",
  "HR_SEAT",
] as const;

export type SubscriptionFeature = (typeof SUBSCRIPTION_FEATURES)[number];

export type PlanAudience = "RECRUITER" | "CANDIDATE";

/**
 * Every method the backend can store. STRIPE and MOMO are kept so historical
 * invoices still render; checkout only offers {@link CHECKOUT_PAYMENT_METHODS}.
 */
export type PaymentMethod = "STRIPE" | "MOMO" | "SEPAY" | "PAYPAL";

/** Methods a recruiter can actually pick today. */
export type CheckoutPaymentMethod = "SEPAY" | "PAYPAL";

export type PlanFeature = Readonly<{
  id: string;
  planId: string;
  feature: SubscriptionFeature;
  enabled: boolean;
  /** null = unlimited */
  limitValue: number | null;
}>;

export type SubscriptionPlan = Readonly<{
  id: string;
  code: string | null;
  audience: PlanAudience;
  subscriptionName: string;
  price: string;
  description: string;
  durationDays: number;
  isPublic: boolean;
  /** Badge such as "Phổ biến nhất" rendered on the pricing card. */
  highlightLabel: string | null;
  sortOrder: number;
  boostCreditLimit: number;
  jobPostLimit: number;
  /** Prisma returns enum keys, so these are uppercase on the wire. */
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  features: PlanFeature[];
}>;

export type QuotaSnapshot = Readonly<{
  feature: SubscriptionFeature;
  enabled: boolean;
  /** null = unlimited */
  limit: number | null;
  used: number;
  /** null = unlimited */
  remaining: number | null;
  periodStart: string;
  periodEnd: string;
}>;

export type CompanySubscriptionDetail = Readonly<{
  id: string;
  planId: string;
  companyId: string;
  jobPostLimit: number;
  jobPostUsed: number;
  boostCreditTotal: number;
  boostCreditUsed: number;
  startedAt: string;
  expiredAt: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlan;
}>;

export type InvoiceDetail = Readonly<{
  id: string;
  subscriptionPlanId: string;
  companyId: string;
  invoiceCode: string;
  amount: string;
  paymentMethod: PaymentMethod | null;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: SubscriptionPlan;
}>;

export function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>("/subscription-plans");
}

/** Plans open for sale, for the public pricing page. Needs no authentication. */
export function getPublicSubscriptionPlans(
  audience: PlanAudience = "RECRUITER",
): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>(`/subscription-plans/public?audience=${audience}`);
}

/** Quota used/remaining for the current billing period. */
export function getSubscriptionUsage(token: string): Promise<QuotaSnapshot[]> {
  return apiRequest<QuotaSnapshot[]>("/subscriptions/usage", {
    headers: authHeaders(token),
  });
}

export function setPlanFeatures(
  planId: string,
  features: Array<{ feature: SubscriptionFeature; enabled: boolean; limitValue: number | null }>,
  token: string,
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(`/subscription-plans/${planId}/features`, {
    body: JSON.stringify({ features }),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
}

export function getActiveSubscription(token: string): Promise<CompanySubscriptionDetail> {
  return apiRequest<CompanySubscriptionDetail>("/company-subscriptions/active", {
    headers: authHeaders(token),
  });
}

export function getInvoices(token: string): Promise<InvoiceDetail[]> {
  return apiRequest<InvoiceDetail[]>("/invoices", {
    headers: authHeaders(token),
  });
}

export function createInvoice(planId: string, token: string): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>("/invoices", {
    body: JSON.stringify({ subscriptionPlanId: planId }),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function payInvoice(
  invoiceId: string,
  paymentMethod: CheckoutPaymentMethod,
  token: string,
): Promise<InvoiceDetail> {
  return apiRequest<InvoiceDetail>(`/invoices/${invoiceId}/pay`, {
    body: JSON.stringify({ paymentMethod }),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}
