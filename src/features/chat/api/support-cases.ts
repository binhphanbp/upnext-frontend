import { apiRequest } from "@/shared/api/http";

import type { SupportCase, SupportCaseStatus, SupportPriority } from "../types/contracts";

export type EligibleSupportJobPost = Readonly<{
  id: string;
  title: string;
  moderationStatus: "PENDING" | "REJECTED";
}>;

export type SupportInvoiceOption = Readonly<{
  id: string;
  invoiceCode: string;
  amount: string | number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
}>;

export type SupportCompanyOption = Readonly<{
  id: string;
  name: string;
  status: "ACTIVE" | "LOCKED";
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  eligibleForVerificationSupport: boolean;
}>;

export type SupportCaseCreationOptions = Readonly<{
  jobPosts: EligibleSupportJobPost[];
  invoices: SupportInvoiceOption[];
  company: SupportCompanyOption;
}>;

export type EligibleSupportAssignee = Readonly<{
  id: string;
  fullName: string;
  email: string;
  role: { roleName: string } | null;
}>;

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export type CreateSupportCaseInput = Readonly<{
  clientRequestId: string;
  categoryCode: string;
  title: string;
  description: string;
  priority?: SupportPriority;
  jobPostId?: string;
  invoiceId?: string;
  companySubscriptionId?: string;
}>;

export function createSupportCase(token: string, input: CreateSupportCaseInput) {
  return apiRequest<{ data: SupportCase }>("/support-cases", {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(input),
  });
}

export function getRecruiterSupportCases(token: string) {
  return apiRequest<{ data: SupportCase[] }>("/support-cases", { headers: headers(token) });
}

export function getEligibleSupportJobPosts(token: string) {
  return apiRequest<{ data: EligibleSupportJobPost[] }>("/support-cases/eligible-job-posts", {
    headers: headers(token),
  });
}

export function getSupportCaseCreationOptions(token: string) {
  return apiRequest<{ data: SupportCaseCreationOptions }>("/support-cases/creation-options", {
    headers: headers(token),
  });
}

export function getAdminSupportCases(token: string) {
  return apiRequest<{ data: SupportCase[] }>("/admin/support-cases", {
    headers: headers(token),
  });
}

export function getSupportCase(token: string, id: string, admin: boolean) {
  return apiRequest<{ data: SupportCase }>(`${admin ? "/admin" : ""}/support-cases/${id}`, {
    headers: headers(token),
  });
}

export function getEligibleSupportAssignees(token: string, id: string) {
  return apiRequest<{ data: EligibleSupportAssignee[] }>(
    `/admin/support-cases/${id}/eligible-assignees`,
    { headers: headers(token) },
  );
}

export function claimSupportCase(token: string, id: string, expectedVersion: number) {
  return apiRequest<{ data: SupportCase }>(`/admin/support-cases/${id}/claim`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ expectedVersion }),
  });
}

export function transferSupportCase(
  token: string,
  id: string,
  input: { expectedVersion: number; toAdminUserId: string; reason: string },
) {
  return apiRequest<{ data: SupportCase }>(`/admin/support-cases/${id}/transfer`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(input),
  });
}

export function changeSupportCaseStatus(
  token: string,
  id: string,
  input: {
    expectedVersion: number;
    status: SupportCaseStatus;
    resolutionCode?: string;
    resolutionSummary?: string;
    reason?: string;
  },
) {
  return apiRequest<{ data: SupportCase }>(`/admin/support-cases/${id}/status`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify(input),
  });
}
