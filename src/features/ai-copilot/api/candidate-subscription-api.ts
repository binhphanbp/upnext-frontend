import { getCandidateSession } from "@/features/candidate/session";
import { apiRequest } from "@/shared/api/http";

export const AI_COPILOT_QUOTA_FEATURE = "AI_COPILOT_RUN";

export type CandidateCopilotQuota = {
  feature: typeof AI_COPILOT_QUOTA_FEATURE;
  enabled: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  periodStart: string;
  periodEnd: string;
};

export type CandidateSubscriptionSummary = {
  plan: {
    code: string | null;
    name: string;
    audience: "CANDIDATE";
    expiresAt: string;
    periodStart: string;
    periodEnd: string;
  };
  usage: CandidateCopilotQuota[];
};

function authHeaders(): HeadersInit {
  const session = getCandidateSession();
  if (!session) throw new Error("Bạn cần đăng nhập để dùng AI Copilot.");
  return { Authorization: `Bearer ${session.accessToken}` };
}

/** Reads the candidate's own plan; this endpoint never exposes another user's usage. */
export async function getCandidateSubscription(): Promise<CandidateSubscriptionSummary> {
  const response = await apiRequest<{ data: CandidateSubscriptionSummary }>(
    "/candidate-subscriptions/me",
    { headers: authHeaders() },
  );
  return response.data;
}

export function findCopilotQuota(subscription: CandidateSubscriptionSummary | undefined) {
  return subscription?.usage.find(
    (usage): usage is CandidateCopilotQuota => usage.feature === AI_COPILOT_QUOTA_FEATURE,
  );
}
