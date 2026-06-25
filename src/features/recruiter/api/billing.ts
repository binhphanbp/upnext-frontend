import { apiRequest } from "@/shared/api/http";

export type SubscriptionPlan = Readonly<{
  id: string;
  subscriptionName: string;
  price: string;
  description: string;
  durationDays: number;
  boostCreditLimit: number;
  jobPostLimit: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
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
  status: "active" | "inactive" | "expired";
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
  paymentMethod: "STRIPE" | "MOMO" | "SEPAY" | null;
  paymentStatus: "pending" | "paid" | "failed";
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  subscriptionPlan: SubscriptionPlan;
}>;

export function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return apiRequest<SubscriptionPlan[]>("/subscription-plans");
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
  paymentMethod: "STRIPE" | "MOMO" | "SEPAY",
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
