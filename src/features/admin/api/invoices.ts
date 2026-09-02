import { apiRequest } from "@/shared/api/http";

export type AdminPaymentMethod = "SEPAY" | "MOMO" | "STRIPE" | "PAYPAL";
export type AdminPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type AdminInvoiceCompany = Readonly<{
  id: string;
  name: string;
  slug: string;
  taxCode: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  verificationStatus: string;
}>;

export type AdminInvoicePlanFeature = Readonly<{
  id: string;
  feature: string;
  enabled: boolean;
  limitValue: number | null;
}>;

export type AdminInvoicePlan = Readonly<{
  id: string;
  code: string | null;
  audience: string;
  subscriptionName: string;
  price: string | number;
  description: string;
  durationDays: number;
  boostCreditLimit: number;
  talentContactLimit: number;
  features?: AdminInvoicePlanFeature[];
}>;

export type AdminInvoiceItem = Readonly<{
  id: string;
  subscriptionPlanId: string;
  companyId: string;
  invoiceCode: string;
  amount: string | number;
  paymentMethod: AdminPaymentMethod | null;
  paymentStatus: AdminPaymentStatus;
  paymentReference: string | null;
  paidAt: string | null;
  adminNote: string | null;
  cancelledAt: string | null;
  cancelledReason: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  refundReference: string | null;
  createdAt: string;
  updatedAt: string;
  company: AdminInvoiceCompany;
  subscriptionPlan: AdminInvoicePlan;
}>;

export type AdminInvoiceStats = Readonly<{
  totalRevenue: number;
  pendingRevenue: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}>;

export type AdminInvoiceQuery = {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  paymentStatus?: AdminPaymentStatus | "ALL" | undefined;
  paymentMethod?: AdminPaymentMethod | "ALL" | undefined;
  subscriptionPlanId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  sortBy?: "createdAt" | "amount" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
};

export type PaginatedAdminInvoices = Readonly<{
  items: AdminInvoiceItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}>;

export function getAdminInvoiceStats(token: string): Promise<AdminInvoiceStats> {
  return apiRequest<AdminInvoiceStats>("/admin/invoices/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAdminInvoices(
  query: AdminInvoiceQuery,
  token: string,
): Promise<PaginatedAdminInvoices> {
  const searchParams = new URLSearchParams();
  if (query.page) searchParams.set("page", String(query.page));
  if (query.limit) searchParams.set("limit", String(query.limit));
  if (query.search?.trim()) searchParams.set("search", query.search.trim());
  if (query.paymentStatus && query.paymentStatus !== "ALL") {
    searchParams.set("paymentStatus", query.paymentStatus);
  }
  if (query.paymentMethod && query.paymentMethod !== "ALL") {
    searchParams.set("paymentMethod", query.paymentMethod);
  }
  if (query.subscriptionPlanId) searchParams.set("subscriptionPlanId", query.subscriptionPlanId);
  if (query.fromDate) searchParams.set("fromDate", query.fromDate);
  if (query.toDate) searchParams.set("toDate", query.toDate);
  if (query.sortBy) searchParams.set("sortBy", query.sortBy);
  if (query.sortOrder) searchParams.set("sortOrder", query.sortOrder);

  const qs = searchParams.toString();
  const url = qs ? `/admin/invoices?${qs}` : "/admin/invoices";

  return apiRequest<PaginatedAdminInvoices>(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getAdminInvoiceDetail(id: string, token: string): Promise<AdminInvoiceItem> {
  return apiRequest<AdminInvoiceItem>(`/admin/invoices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function manualConfirmInvoice(
  id: string,
  payload: {
    paymentReference: string;
    paymentMethod?: AdminPaymentMethod | undefined;
    adminNote?: string | undefined;
  },
  token: string,
): Promise<AdminInvoiceItem> {
  return apiRequest<AdminInvoiceItem>(`/admin/invoices/${id}/manual-confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function cancelInvoice(
  id: string,
  payload: { reason: string },
  token: string,
): Promise<AdminInvoiceItem> {
  return apiRequest<AdminInvoiceItem>(`/admin/invoices/${id}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function refundInvoice(
  id: string,
  payload: {
    reason: string;
    refundReference?: string | undefined;
    adminNote?: string | undefined;
  },
  token: string,
): Promise<AdminInvoiceItem> {
  return apiRequest<AdminInvoiceItem>(`/admin/invoices/${id}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}
