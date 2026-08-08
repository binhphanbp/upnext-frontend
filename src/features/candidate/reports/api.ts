import { apiRequest } from "@/shared/api/http";

/** The only targets a candidate can report from the UI. */
export type CandidateReportTargetType = "COMPANY" | "JOB_POST";

export type CreateReportPayload = Readonly<{
  targetType: CandidateReportTargetType;
  targetId: string;
  reason: string;
  evidenceFileId?: string;
}>;

export type ReportResponse = Readonly<{
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}>;

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function createReport(payload: CreateReportPayload, token: string) {
  return apiRequest<ReportResponse>("/reports", {
    body: JSON.stringify(payload),
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    method: "POST",
  });
}

export type CandidateReportStatusResponse = Readonly<{
  hasActiveReport: boolean;
  report?: { id: string; status: string; createdAt: string } | null;
}>;

export function checkCandidateReportStatus(
  targetType: CandidateReportTargetType,
  targetId: string,
  token: string,
) {
  return apiRequest<CandidateReportStatusResponse>(
    `/reports/check?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`,
    {
      headers: authHeaders(token),
    },
  );
}

/**
 * Uploads a screenshot to attach to a report. `REPORT_EVIDENCE` keeps it out of the
 * public buckets — only admins ever open it.
 */
export function uploadReportEvidence(file: File, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", "REPORT_EVIDENCE");
  formData.append("visibility", "PRIVATE");

  return apiRequest<{ file: { id: string; originalName: string; publicUrl: string } }>(
    "/files/upload",
    {
      body: formData,
      headers: authHeaders(token),
      method: "POST",
    },
  );
}
