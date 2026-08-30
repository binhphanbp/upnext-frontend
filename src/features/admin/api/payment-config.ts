import type { PaymentMethod } from "@/features/recruiter/api/billing";
import { apiRequest } from "@/shared/api/http";

export type AdminPaymentConfig = Readonly<{
  provider: PaymentMethod;
  isEnabled: boolean;
  bankName: string | null;
  bankBin: string | null;
  accountNumber: string | null;
  accountName: string | null;
  /** Last 4 characters only, or null if no key is set -- never the real secret. */
  webhookApiKeyMasked: string | null;
  /** Paste this into the SePay dashboard's webhook settings. */
  webhookUrl: string;
}>;

export type UpsertPaymentConfigPayload = Readonly<{
  isEnabled?: boolean | undefined;
  bankName?: string | undefined;
  bankBin?: string | undefined;
  accountNumber?: string | undefined;
  accountName?: string | undefined;
  /** Omit or leave blank to keep the currently configured key unchanged. */
  webhookApiKey?: string | undefined;
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
