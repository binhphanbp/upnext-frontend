import { endOfDay, startOfDay, startOfMonth, subDays, subMilliseconds, subMonths } from "date-fns";

export type DashboardPeriod = "day" | "week" | "month" | "year";
export type DashboardBucket = "hour" | "day" | "month";

export type DashboardDateRange = {
  bucket: DashboardBucket;
  compareLabel: string;
  from: Date;
  label: string;
  previousFrom: Date;
  previousTo: Date;
  to: Date;
};

export const dashboardPeriodLabels: Record<DashboardPeriod, string> = {
  day: "1 ngày",
  month: "1 tháng",
  week: "1 tuần",
  year: "1 năm",
};

export function getDashboardDateRange(
  period: DashboardPeriod,
  now = new Date(),
): DashboardDateRange {
  if (period === "day") {
    const from = startOfDay(now);
    const previousTo = subDays(now, 1);
    const previousFrom = startOfDay(previousTo);

    return {
      bucket: "hour",
      compareLabel: "so với hôm qua",
      from,
      label: "hôm nay",
      previousFrom,
      previousTo,
      to: now,
    };
  }

  if (period === "week") {
    const from = startOfDay(subDays(now, 6));
    const previousTo = subMilliseconds(from, 1);
    const previousFrom = startOfDay(subDays(from, 7));

    return {
      bucket: "day",
      compareLabel: "so với 7 ngày trước",
      from,
      label: "7 ngày",
      previousFrom,
      previousTo,
      to: now,
    };
  }

  if (period === "month") {
    const from = startOfDay(subDays(now, 29));
    const previousTo = subMilliseconds(from, 1);
    const previousFrom = startOfDay(subDays(from, 30));

    return {
      bucket: "day",
      compareLabel: "so với 30 ngày trước",
      from,
      label: "30 ngày",
      previousFrom,
      previousTo,
      to: now,
    };
  }

  const from = startOfMonth(subMonths(now, 11));
  const previousTo = subMilliseconds(from, 1);
  const previousFrom = startOfMonth(subMonths(from, 12));

  return {
    bucket: "month",
    compareLabel: "so với 12 tháng trước",
    from,
    label: "12 tháng",
    previousFrom,
    previousTo,
    to: endOfDay(now),
  };
}
