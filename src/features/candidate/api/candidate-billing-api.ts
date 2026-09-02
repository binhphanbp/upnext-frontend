import {
  checkSepayPayment,
  type CheckSepayPaymentResponse,
} from "@/features/admin/api/payment-config";
import type { PublicSepayConfig } from "@/features/recruiter/api/payment-config";
import { getPublicSepayConfig } from "@/features/recruiter/api/payment-config";
import { apiRequest } from "@/shared/api/http";

export type CandidateInvoice = Readonly<{
  id: string;
  invoiceCode: string;
  amount: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string | null;
  paymentReference: string | null;
  candidateProfileId: string | null;
  companyId: string | null;
  paidAt: string | null;
  createdAt: string;
  subscriptionPlan: {
    id: string;
    code: string;
    subscriptionName: string;
    price: string;
    durationDays: number;
    description?: string | null;
  };
}>;

export function createCandidateInvoice(
  subscriptionPlanId: string,
  accessToken: string,
): Promise<CandidateInvoice> {
  return apiRequest<CandidateInvoice>("/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscriptionPlanId }),
  });
}

export function getCandidateInvoice(id: string, accessToken: string): Promise<CandidateInvoice> {
  return apiRequest<CandidateInvoice>(`/invoices/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getCandidateInvoices(accessToken: string): Promise<CandidateInvoice[]> {
  return apiRequest<CandidateInvoice[]>("/invoices", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function cancelCandidateInvoice(id: string, accessToken: string): Promise<CandidateInvoice> {
  return apiRequest<CandidateInvoice>(`/invoices/${id}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export { getPublicSepayConfig, checkSepayPayment };
export type { PublicSepayConfig, CheckSepayPaymentResponse };
