import { useTranslations } from "next-intl";

import type {
  InterviewResult,
  InterviewStatus,
  InterviewType,
} from "@/features/recruiter/api/interviews";
import { Badge } from "@/shared/ui/badge";

type BadgeTone = "brand" | "premium" | "success" | "warning" | "info" | "neutral" | "error";

const STATUS_TONE: Record<InterviewStatus, BadgeTone> = {
  SCHEDULED: "info",
  RESCHEDULED: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "neutral",
};

const RESULT_TONE: Record<InterviewResult, BadgeTone> = {
  PENDING: "neutral",
  PASSED: "success",
  FAILED: "error",
  UNDER_REVIEW: "warning",
};

const TYPE_TONE: Record<InterviewType, BadgeTone> = {
  ONLINE: "brand",
  ONSITE: "premium",
};

export function InterviewStatusBadge({ status }: { status: InterviewStatus }) {
  const t = useTranslations("Recruiter");
  return <Badge tone={STATUS_TONE[status]}>{t(`interviews.status.${status}`)}</Badge>;
}

export function InterviewResultBadge({ result }: { result: InterviewResult }) {
  const t = useTranslations("Recruiter");
  return <Badge tone={RESULT_TONE[result]}>{t(`interviews.result.${result}`)}</Badge>;
}

export function InterviewTypeBadge({ type }: { type: InterviewType }) {
  const t = useTranslations("Recruiter");
  return <Badge tone={TYPE_TONE[type]}>{t(`interviews.type.${type}`)}</Badge>;
}
