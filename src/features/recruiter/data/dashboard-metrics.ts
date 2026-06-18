import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  format,
  formatDistanceToNowStrict,
  isAfter,
  isBefore,
  isSameDay,
  isWithinInterval,
} from "date-fns";
import { vi } from "date-fns/locale";

import {
  dashboardApplications,
  dashboardInterviews,
  dashboardJobs,
  dashboardJobViews,
  dashboardMetricIcons,
  dashboardOffers,
  dashboardReferenceNow,
  dashboardTrustSnapshots,
  type DashboardApplicationStage,
  type DashboardInterviewStatus,
  type DashboardJob,
} from "@/features/recruiter/data/dashboard-data";
import {
  getDashboardDateRange,
  type DashboardBucket,
  type DashboardDateRange,
  type DashboardPeriod,
} from "@/features/recruiter/data/dashboard-date-range";
import type { LucideIcon } from "@/features/recruiter/icons";

export type TrendDirection = "up" | "down" | "flat";
export type MetricTone = "good" | "warning" | "danger" | "neutral" | "info";
export type MetricGoodWhen = "increase" | "decrease" | "neutral";

export type DashboardMetricKey =
  | "activeJobs"
  | "newApplications"
  | "interviews"
  | "responseRate"
  | "applicationRate"
  | "trustScore"
  | "unviewedCvs"
  | "expiringJobs"
  | "upcomingInterviews"
  | "interviewsNeedFeedback"
  | "offersNeedUpdate"
  | "noShowInterviews";

export type DashboardMetricRule = {
  goodWhen: MetricGoodWhen;
  key: DashboardMetricKey;
  label: string;
  tone: MetricTone;
  valueType: "number" | "percent" | "score";
};

export type DashboardTrend = {
  amount: string;
  compareLabel: string;
  direction: TrendDirection;
  text: string;
  tone: MetricTone;
};

export type DashboardKpiCard = {
  icon: LucideIcon;
  key: DashboardMetricKey;
  label: string;
  tone: MetricTone;
  trend: DashboardTrend;
  value: string;
};

export type DashboardTaskCardItem = {
  count: number;
  icon: LucideIcon;
  key: DashboardMetricKey;
  label: string;
  tone: MetricTone;
};

export type DashboardChartPoint = {
  interviews: number;
  label: string;
  profiles: number;
};

export type DashboardPipelineStage = {
  color: string;
  label: string;
  percent: number;
  value: string;
};

export type DashboardInterviewScheduleItem = {
  duration: string;
  name: string;
  role: string;
  round: string;
  status: DashboardInterviewStatus;
  time: string;
};

export type RecruiterDashboardViewModel = {
  chart: {
    points: DashboardChartPoint[];
    title: string;
    totalInterviews: string;
    totalProfiles: string;
    trendInterviews: DashboardTrend;
    trendProfiles: DashboardTrend;
  };
  compareLabel: string;
  interviewSchedule: DashboardInterviewScheduleItem[];
  kpis: DashboardKpiCard[];
  period: DashboardPeriod;
  pipeline: {
    stages: DashboardPipelineStage[];
    title: string;
  };
  range: DashboardDateRange;
  tasks: DashboardTaskCardItem[];
};

const dashboardMetricRules: Record<DashboardMetricKey, DashboardMetricRule> = {
  activeJobs: {
    goodWhen: "increase",
    key: "activeJobs",
    label: "Tin đang tuyển",
    tone: "info",
    valueType: "number",
  },
  applicationRate: {
    goodWhen: "increase",
    key: "applicationRate",
    label: "Tỷ lệ ứng tuyển",
    tone: "info",
    valueType: "percent",
  },
  expiringJobs: {
    goodWhen: "decrease",
    key: "expiringJobs",
    label: "Tin sắp hết hạn",
    tone: "warning",
    valueType: "number",
  },
  interviews: {
    goodWhen: "increase",
    key: "interviews",
    label: "Phỏng vấn",
    tone: "good",
    valueType: "number",
  },
  interviewsNeedFeedback: {
    goodWhen: "decrease",
    key: "interviewsNeedFeedback",
    label: "Phỏng vấn cần đánh giá",
    tone: "warning",
    valueType: "number",
  },
  newApplications: {
    goodWhen: "increase",
    key: "newApplications",
    label: "Hồ sơ mới",
    tone: "warning",
    valueType: "number",
  },
  noShowInterviews: {
    goodWhen: "decrease",
    key: "noShowInterviews",
    label: "Không tham gia",
    tone: "danger",
    valueType: "number",
  },
  offersNeedUpdate: {
    goodWhen: "decrease",
    key: "offersNeedUpdate",
    label: "Offer chưa cập nhật kết quả",
    tone: "warning",
    valueType: "number",
  },
  responseRate: {
    goodWhen: "increase",
    key: "responseRate",
    label: "Tỷ lệ phản hồi",
    tone: "neutral",
    valueType: "percent",
  },
  trustScore: {
    goodWhen: "increase",
    key: "trustScore",
    label: "Điểm uy tín",
    tone: "info",
    valueType: "score",
  },
  upcomingInterviews: {
    goodWhen: "decrease",
    key: "upcomingInterviews",
    label: "Lịch sắp diễn ra",
    tone: "info",
    valueType: "number",
  },
  unviewedCvs: {
    goodWhen: "decrease",
    key: "unviewedCvs",
    label: "CV chưa xem",
    tone: "neutral",
    valueType: "number",
  },
};

const pipelineColors = [
  "bg-emerald-500",
  "bg-emerald-500",
  "bg-emerald-500",
  "bg-amber-400",
  "bg-orange-500",
  "bg-rose-500",
  "bg-emerald-500",
] as const;

export const interviewStatusLabels: Record<DashboardInterviewStatus, string> = {
  CANCELLED: "Đã hủy",
  COMPLETED: "Hoàn thành",
  NEEDS_FEEDBACK: "Cần đánh giá",
  NO_SHOW: "Không tham gia",
  SCHEDULED: "Đã lên lịch",
  UPCOMING: "Sắp diễn ra",
};

export function getTrendDirection(current: number, previous: number): TrendDirection {
  if (current > previous) {
    return "up";
  }

  if (current < previous) {
    return "down";
  }

  return "flat";
}

export function getTrendTone(
  goodWhen: MetricGoodWhen,
  direction: TrendDirection,
  baseTone: MetricTone = "neutral",
): MetricTone {
  if (baseTone === "warning") {
    return "warning";
  }

  if (direction === "flat") {
    return "neutral";
  }

  if (goodWhen === "increase") {
    return direction === "up" ? "good" : "danger";
  }

  if (goodWhen === "decrease") {
    return direction === "up" ? "danger" : "good";
  }

  return "neutral";
}

export function getRecruiterDashboardViewModel(
  period: DashboardPeriod,
  now = dashboardReferenceNow,
): RecruiterDashboardViewModel {
  const range = getDashboardDateRange(period, now);
  const current = getMetricValues(range, now);
  const previous = getMetricValues(
    {
      from: range.previousFrom,
      to: range.previousTo,
    },
    now,
  );

  const kpis = [
    buildKpiCard("activeJobs", current.activeJobs, previous.activeJobs, range.compareLabel, period),
    buildKpiCard(
      "newApplications",
      current.newApplications,
      previous.newApplications,
      range.compareLabel,
      period,
    ),
    buildKpiCard("interviews", current.interviews, previous.interviews, range.compareLabel, period),
    buildKpiCard(
      "responseRate",
      current.responseRate,
      previous.responseRate,
      range.compareLabel,
      period,
    ),
    buildKpiCard(
      "applicationRate",
      current.applicationRate,
      previous.applicationRate,
      range.compareLabel,
      period,
    ),
    buildKpiCard("trustScore", current.trustScore, previous.trustScore, range.compareLabel, period),
  ];

  return {
    chart: {
      points: buildChartPoints(range),
      title: `Hiệu suất tuyển dụng ${range.label}`,
      totalInterviews: formatNumber(current.interviews),
      totalProfiles: formatNumber(current.newApplications),
      trendInterviews: buildTrend(
        dashboardMetricRules.interviews,
        current.interviews,
        previous.interviews,
        range.compareLabel,
      ),
      trendProfiles: buildTrend(
        dashboardMetricRules.newApplications,
        current.newApplications,
        previous.newApplications,
        range.compareLabel,
      ),
    },
    compareLabel: range.compareLabel,
    interviewSchedule: buildInterviewSchedule(now),
    kpis,
    period,
    pipeline: {
      stages: buildPipelineStages(range),
      title: `Tiến độ tuyển dụng ${range.label}`,
    },
    range,
    tasks: buildTaskItems(now),
  };
}

function buildKpiCard(
  key: DashboardMetricKey,
  current: number,
  previous: number,
  compareLabel: string,
  period: DashboardPeriod,
): DashboardKpiCard {
  const rule = dashboardMetricRules[key];
  const label =
    key === "interviews"
      ? getInterviewsLabel(period)
      : key === "trustScore"
        ? "Điểm uy tín"
        : rule.label;

  return {
    icon: dashboardMetricIcons[key],
    key,
    label,
    tone: rule.tone,
    trend: buildTrend(rule, current, previous, compareLabel),
    value: formatMetricValue(rule.valueType, current),
  };
}

function buildTrend(
  rule: DashboardMetricRule,
  current: number,
  previous: number,
  compareLabel: string,
): DashboardTrend {
  const direction = getTrendDirection(current, previous);
  const tone = getTrendTone(rule.goodWhen, direction, rule.tone);
  const delta = Math.abs(current - previous);

  return {
    amount: formatTrendDelta(rule.valueType, delta),
    compareLabel,
    direction,
    text: `${formatTrendDelta(rule.valueType, delta)} ${compareLabel}`,
    tone,
  };
}

function getMetricValues(range: Pick<DashboardDateRange, "from" | "to">, now: Date) {
  const activeJobs = dashboardJobs.filter((job) => isActiveJob(job, now)).length;
  const newApplications = dashboardApplications.filter((application) =>
    isWithinRange(application.createdAt, range),
  ).length;
  const interviews = dashboardInterviews.filter(
    (interview) => isWithinRange(interview.scheduledAt, range) && interview.status !== "CANCELLED",
  ).length;
  const responseRate = calculateResponseRate(range);
  const applicationRate = calculateApplicationRate(range);
  const trustScore = calculateTrustScore(range.to);

  return {
    activeJobs,
    applicationRate,
    interviews,
    newApplications,
    responseRate,
    trustScore,
  };
}

function calculateResponseRate(range: Pick<DashboardDateRange, "from" | "to">) {
  const currentApplications = dashboardApplications.filter((application) =>
    isWithinRange(application.createdAt, range),
  );

  if (currentApplications.length === 0) {
    return 0;
  }

  const responded = currentApplications.filter((application) => {
    const deadline = new Date(application.createdAt.getTime() + 48 * 60 * 60 * 1000);

    return [
      application.cvViewedAt,
      application.recruiterMessageSentAt,
      application.interviewCreatedAt,
      application.rejectedAt,
    ].some((value) => value !== null && value.getTime() <= deadline.getTime());
  });

  return (responded.length / currentApplications.length) * 100;
}

function calculateApplicationRate(range: Pick<DashboardDateRange, "from" | "to">) {
  const totalApplications = dashboardApplications.filter((application) =>
    isWithinRange(application.createdAt, range),
  ).length;
  const uniqueJobViews = new Set(
    dashboardJobViews
      .filter((view) => isWithinRange(view.viewedAt, range))
      .map((view) => `${view.jobId}:${view.visitorId}`),
  ).size;

  if (uniqueJobViews === 0) {
    return 0;
  }

  return (totalApplications / uniqueJobViews) * 100;
}

function calculateTrustScore(date: Date) {
  const latestSnapshot = [...dashboardTrustSnapshots]
    .filter((snapshot) => snapshot.date.getTime() <= date.getTime())
    .sort((left, right) => right.date.getTime() - left.date.getTime())[0];

  if (!latestSnapshot) {
    return 0;
  }

  const score =
    latestSnapshot.profileVerificationScore * 0.3 +
    latestSnapshot.responseScore * 0.3 +
    latestSnapshot.jobQualityScore * 0.2 +
    latestSnapshot.violationScore * 0.2;

  return Math.max(0, Math.min(100, score));
}

function buildChartPoints(range: DashboardDateRange): DashboardChartPoint[] {
  const buckets =
    range.bucket === "hour"
      ? eachHourOfInterval({ end: range.to, start: range.from })
      : range.bucket === "day"
        ? eachDayOfInterval({ end: range.to, start: range.from })
        : eachMonthOfInterval({ end: range.to, start: range.from });

  return buckets.map((bucketStart) => {
    const profiles = dashboardApplications.filter((application) =>
      isInBucket(application.createdAt, bucketStart, range.bucket),
    ).length;
    const interviews = dashboardInterviews.filter(
      (interview) =>
        interview.status !== "CANCELLED" &&
        isInBucket(interview.scheduledAt, bucketStart, range.bucket),
    ).length;

    return {
      interviews,
      label: formatBucketLabel(bucketStart, range.bucket, range),
      profiles,
    };
  });
}

function buildPipelineStages(
  range: Pick<DashboardDateRange, "from" | "to">,
): DashboardPipelineStage[] {
  const applications = dashboardApplications.filter((application) =>
    isWithinRange(application.createdAt, range),
  );
  const totalApplications = applications.length;

  const getStageCount = (
    stage: DashboardApplicationStage | "INTERVIEW_COMPLETED" | "OFFER_SENT" | "HIRED",
  ) => {
    if (stage === "INTERVIEW_COMPLETED") {
      return applications.filter((application) => {
        const interview = findLatestInterview(application.id);
        return interview?.status === "COMPLETED";
      }).length;
    }

    if (stage === "OFFER_SENT") {
      return applications.filter((application) =>
        dashboardOffers.some((offer) => offer.applicationId === application.id),
      ).length;
    }

    if (stage === "HIRED") {
      return applications.filter((application) => application.status === "HIRED").length;
    }

    return applications.filter((application) => application.reachedStages.includes(stage)).length;
  };

  const stages = [
    { label: "Đã nộp", value: totalApplications },
    { label: "Đã xem", value: getStageCount("VIEWED") },
    { label: "Sàng lọc", value: getStageCount("SCREENING") },
    { label: "Hẹn PV", value: getStageCount("INTERVIEW_CREATED") },
    { label: "Phỏng vấn", value: getStageCount("INTERVIEW_COMPLETED") },
    { label: "Offer", value: getStageCount("OFFER_SENT") },
    { label: "Trúng tuyển", value: getStageCount("HIRED") },
  ];

  return stages.map((stage, index) => ({
    color: pipelineColors[index] ?? "bg-slate-300",
    label: stage.label,
    percent: totalApplications === 0 ? 0 : Math.round((stage.value / totalApplications) * 100),
    value: formatNumber(stage.value),
  }));
}

function buildTaskItems(now: Date): DashboardTaskCardItem[] {
  const activeJobIds = new Set(
    dashboardJobs.filter((job) => isActiveJob(job, now)).map((job) => job.id),
  );
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  return [
    {
      count: dashboardApplications.filter(
        (application) =>
          activeJobIds.has(application.jobId) &&
          application.cvViewedAt === null &&
          (application.status === "NEW" || application.status === "SUBMITTED"),
      ).length,
      icon: dashboardMetricIcons.unviewedCvs,
      key: "unviewedCvs",
      label: "CV chưa xem",
      tone: dashboardMetricRules.unviewedCvs.tone,
    },
    {
      count: dashboardJobs.filter((job) => {
        if (!isActiveJob(job, now)) {
          return false;
        }

        return (
          isAfter(job.expiresAt, now) &&
          isBefore(job.expiresAt, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
        );
      }).length,
      icon: dashboardMetricIcons.expiringJobs,
      key: "expiringJobs",
      label: "Tin sắp hết hạn",
      tone: dashboardMetricRules.expiringJobs.tone,
    },
    {
      count: dashboardInterviews.filter(
        (interview) =>
          interview.status === "SCHEDULED" &&
          isAfter(interview.scheduledAt, now) &&
          isBefore(interview.scheduledAt, twoHoursLater),
      ).length,
      icon: dashboardMetricIcons.upcomingInterviews,
      key: "upcomingInterviews",
      label: "Lịch sắp diễn ra",
      tone: dashboardMetricRules.upcomingInterviews.tone,
    },
    {
      count: dashboardInterviews.filter(
        (interview) =>
          isBefore(interview.endAt, now) &&
          interview.feedbackSubmittedAt === null &&
          interview.status !== "CANCELLED" &&
          interview.status !== "NO_SHOW",
      ).length,
      icon: dashboardMetricIcons.interviewsNeedFeedback,
      key: "interviewsNeedFeedback",
      label: "Phỏng vấn cần đánh giá",
      tone: dashboardMetricRules.interviewsNeedFeedback.tone,
    },
    {
      count: dashboardOffers.filter(
        (offer) =>
          (offer.status === "PENDING" || offer.status === "OFFER_SENT") &&
          offer.finalResultAt === null,
      ).length,
      icon: dashboardMetricIcons.offersNeedUpdate,
      key: "offersNeedUpdate",
      label: "Offer chưa cập nhật kết quả",
      tone: dashboardMetricRules.offersNeedUpdate.tone,
    },
  ];
}

function buildInterviewSchedule(now: Date): DashboardInterviewScheduleItem[] {
  return dashboardInterviews
    .filter((interview) => isSameDay(interview.scheduledAt, now))
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime())
    .map((interview) => {
      const application = dashboardApplications.find((item) => item.id === interview.applicationId);

      if (!application) {
        return null;
      }

      return {
        duration: `${interview.durationMinutes}p`,
        name: application.candidateName,
        role: application.role,
        round: interview.round,
        status: interview.status,
        time: format(interview.scheduledAt, "HH:mm"),
      };
    })
    .filter((item): item is DashboardInterviewScheduleItem => item !== null);
}

export function formatMetricValue(
  valueType: DashboardMetricRule["valueType"],
  value: number,
): string {
  if (valueType === "score") {
    return `${Math.round(value)}/100`;
  }

  if (valueType === "percent") {
    return `${formatDecimal(value)}%`;
  }

  return formatNumber(value);
}

function formatTrendDelta(valueType: DashboardMetricRule["valueType"], value: number) {
  if (valueType === "score") {
    return `${Math.round(value)} điểm`;
  }

  if (valueType === "percent") {
    return `${formatDecimal(value)}%`;
  }

  return formatNumber(value);
}

function formatDecimal(value: number) {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getInterviewsLabel(period: DashboardPeriod) {
  if (period === "day") {
    return "Phỏng vấn hôm nay";
  }

  if (period === "week") {
    return "Phỏng vấn 7 ngày";
  }

  if (period === "month") {
    return "Phỏng vấn 30 ngày";
  }

  return "Phỏng vấn 12 tháng";
}

function isWithinRange(date: Date, range: Pick<DashboardDateRange, "from" | "to">) {
  return isWithinInterval(date, {
    end: range.to,
    start: range.from,
  });
}

function isActiveJob(job: DashboardJob, now: Date) {
  return (
    job.status === "ACTIVE" &&
    job.approved &&
    job.lockedAt === null &&
    job.deletedAt === null &&
    job.expiresAt.getTime() >= now.getTime()
  );
}

function isInBucket(date: Date, bucketStart: Date, bucket: DashboardBucket) {
  if (bucket === "hour") {
    return (
      date.getFullYear() === bucketStart.getFullYear() &&
      date.getMonth() === bucketStart.getMonth() &&
      date.getDate() === bucketStart.getDate() &&
      date.getHours() === bucketStart.getHours()
    );
  }

  if (bucket === "day") {
    return isSameDay(date, bucketStart);
  }

  return (
    date.getFullYear() === bucketStart.getFullYear() && date.getMonth() === bucketStart.getMonth()
  );
}

function formatBucketLabel(date: Date, bucket: DashboardBucket, range: DashboardDateRange) {
  if (bucket === "hour") {
    return format(date, "HH:mm");
  }

  if (bucket === "month") {
    return `T${format(date, "M")}`;
  }

  if (range.label === "7 ngày") {
    const weekday = format(date, "i");
    return `T${weekday}`;
  }

  return format(date, "dd/MM");
}

function findLatestInterview(applicationId: string) {
  return [...dashboardInterviews]
    .filter((interview) => interview.applicationId === applicationId)
    .sort((left, right) => right.scheduledAt.getTime() - left.scheduledAt.getTime())[0];
}

export function getTrendClasses(tone: MetricTone) {
  if (tone === "good") {
    return {
      icon: "text-emerald-600",
      text: "text-emerald-600",
    };
  }

  if (tone === "danger") {
    return {
      icon: "text-rose-600",
      text: "text-rose-600",
    };
  }

  if (tone === "warning") {
    return {
      icon: "text-amber-500",
      text: "text-amber-500",
    };
  }

  return {
    icon: "text-slate-400",
    text: "text-slate-500",
  };
}

export function getMetricToneClasses(tone: MetricTone) {
  if (tone === "good") {
    return {
      badge: "bg-emerald-50 text-emerald-700",
      subtle: "bg-emerald-50 text-emerald-500",
    };
  }

  if (tone === "warning") {
    return {
      badge: "bg-amber-50 text-amber-600",
      subtle: "bg-amber-50 text-amber-500",
    };
  }

  if (tone === "danger") {
    return {
      badge: "bg-rose-50 text-rose-600",
      subtle: "bg-rose-50 text-rose-500",
    };
  }

  if (tone === "info") {
    return {
      badge: "bg-blue-50 text-blue-600",
      subtle: "bg-blue-50 text-blue-500",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-600",
    subtle: "bg-slate-100 text-slate-500",
  };
}

export function formatLastActivity(date: Date) {
  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: vi,
  });
}
