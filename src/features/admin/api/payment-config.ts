import type { PaymentMethod } from "@/features/recruiter/api/billing";
import { apiRequest } from "@/shared/api/http";

export type AdminPaymentConfig = Readonly<{
  provider: PaymentMethod;
  isEnabled: boolean;
  bankName: string | null;
  bankBin: string | null;
  accountNumber: string | null;
  accountName: string | null;
  /** Prepend to the invoice code in the transfer content (e.g. "TKPUPN" for a SePay Virtual Account). */
  contentPrefix: string | null;
  /** Last 4 characters only, or null if no secret is set -- never the real secret. */
  webhookSecretMasked: string | null;
  /** Last 4 characters only, or null if no token is set -- used for API polling. */
  apiTokenMasked: string | null;
  /** Paste this into the SePay dashboard's webhook settings. */
  webhookUrl: string;
}>;

export type UpsertPaymentConfigPayload = Readonly<{
  isEnabled?: boolean | undefined;
  bankName?: string | undefined;
  bankBin?: string | undefined;
  accountNumber?: string | undefined;
  accountName?: string | undefined;
  contentPrefix?: string | undefined;
  /** Omit or leave blank to keep the currently configured secret unchanged. */
  webhookSecret?: string | undefined;
  /** Omit or leave blank to keep the currently configured API token unchanged. */
  apiToken?: string | undefined;
}>;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function getAdminPaymentConfig(
  provider: PaymentMethod,
  token: string,
): Promise<AdminPaymentConfig> {
  return apiRequest<AdminPaymentConfig>(`/payments/config/${provider}`, {
    headers: authHeaders(token),
  });
}

export function updateAdminPaymentConfig(
  provider: PaymentMethod,
  payload: UpsertPaymentConfigPayload,
  token: string,
): Promise<AdminPaymentConfig> {
  return apiRequest<AdminPaymentConfig>(`/payments/config/${provider}`, {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
}

export type SimulateSepayPaymentPayload = Readonly<{
  invoiceCode: string;
  amount?: number | undefined;
  customContent?: string | undefined;
}>;

export type SimulateSepayPaymentResponse = Readonly<{
  success: boolean;
  simulatedPayload: Record<string, unknown>;
  webhookResult: {
    handled: boolean;
    reason?: string | undefined;
  };
}>;

export function simulateSepayPayment(
  payload: SimulateSepayPaymentPayload,
  token: string,
): Promise<SimulateSepayPaymentResponse> {
  return apiRequest<SimulateSepayPaymentResponse>("/payments/config/sepay/simulate", {
    body: JSON.stringify(payload),
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export type TestSepayConnectionResponse = Readonly<{
  success: boolean;
  isSandbox: boolean;
  message: string;
  transactionCount?: number;
}>;

export function testSepayConnection(
  adminToken: string,
  customToken?: string,
): Promise<TestSepayConnectionResponse> {
  const query = customToken ? `?token=${encodeURIComponent(customToken)}` : "";
  return apiRequest<TestSepayConnectionResponse>(`/payments/config/sepay/test-connection${query}`, {
    headers: authHeaders(adminToken),
  });
}

export type CheckSepayPaymentResponse = Readonly<{
  paid: boolean;
  status: string;
  message: string;
  invoice?: {
    id: string;
    invoiceCode: string;
    amount: number;
    paymentStatus: string;
  };
  transaction?: Record<string, unknown>;
}>;

/**
 * Check if an invoice has received payment on SePay via API polling.
 * Can be called by recruiters or frontend checkout without admin JWT.
 */
export function checkSepayPayment(
  invoiceIdOrCode: string,
): Promise<CheckSepayPaymentResponse> {
  return apiRequest<CheckSepayPaymentResponse>(`/payments/sepay/check/${encodeURIComponent(invoiceIdOrCode)}`, {
    method: "POST",
  });
}


