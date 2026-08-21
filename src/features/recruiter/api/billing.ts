import { apiRequest } from "@/shared/api/http";

/**
 * Metered features a plan can grant. Mirrors the backend SubscriptionFeature enum.
 *
 * `AI_COPILOT_RUN` was missing here even though it is the one feature every
 * candidate plan actually uses (see candidate-subscription-api.ts, which defines
 * its own disconnected literal for exactly this reason). A candidate plan's
 * `features` array from the API always carries a value this union did not
 * include -- harmless at runtime since TypeScript unions are erased, but any
 * admin UI keyed off this list could never see or edit that feature.
 */
export const SUBSCRIPTION_FEATURES = [
  "JOB_POST",
  "FEATURED_JOB",
  "URGENT_LABEL",
  "CV_POOL_VIEW",
  "TALENT_CONTACT",
  "AI_CV_MATCHING",
  "AI_JD_GENERATE",
  "AI_COPILOT_RUN",
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

/**
 * Mirrors `CreateSubscriptionPlanDto` on the backend. `code` and `audience` are
 * only meaningful at creation: both become immutable once a plan exists, because
 * every tier-based rule and data migration references `code`, and `audience`
 * decides who can buy the plan and which plan is auto-provisioned as free.
 */
export type CreateSubscriptionPlanPayload = Readonly<{
  subscriptionName: string;
  price: number;
  durationDays: number;
  code?: string | undefined;
  audience?: PlanAudience | undefined;
  description?: string | undefined;
  isPublic?: boolean | undefined;
  sortOrder?: number | undefined;
  highlightLabel?: string | null | undefined;
  boostCreditLimit?: number | undefined;
  jobPostLimit?: number | undefined;
  status?: "ACTIVE" | "INACTIVE" | undefined;
}>;

/** `code` and `audience` are deliberately absent -- see the type above. */
export type UpdateSubscriptionPlanPayload = Readonly<
  Partial<Omit<CreateSubscriptionPlanPayload, "code" | "audience">>
>;

export function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>("/subscription-plans");
}

export function createSubscriptionPlan(
  payload: CreateSubscriptionPlanPayload,
  token: string,
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>("/subscription-plans", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export function updateSubscriptionPlan(
  planId: string,
  payload: UpdateSubscriptionPlanPayload,
  token: string,
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(`/subscription-plans/${planId}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
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
