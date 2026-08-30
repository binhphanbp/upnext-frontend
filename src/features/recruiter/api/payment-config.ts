import { apiRequest } from "@/shared/api/http";

/**
 * Bank info the recruiter checkout modal needs to render the SePay tab
 * (bank name, account, VietQR image). No token required -- this is public,
 * non-secret data an admin configures in "Cấu hình thanh toán".
 */
export type PublicSepayConfig = Readonly<{
  enabled: boolean;
  bankName: string | null;
  bankBin: string | null;
  accountNumber: string | null;
  accountName: string | null;
}>;

export function getPublicSepayConfig(): Promise<PublicSepayConfig> {
  return apiRequest<PublicSepayConfig>("/payments/config/sepay/public");
}
