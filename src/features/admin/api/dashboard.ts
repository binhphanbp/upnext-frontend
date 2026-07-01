import { apiRequest } from "@/shared/api/http";

export type AdminDashboardParams = {
  chartPeriod?: "week" | "month" | "year";
  year?: number;
  month?: number;
  weekStart?: string;
  activityLimit?: number;
};

export type AdminDashboardSummary = {
  revenue: {
    total: number;
    currentWeek: number;
    previousWeek: number;
    growthPercent: number;
  };
  newUsers: {
    currentWeek: { candidate: number; recruiter: number; total: number };
    previousWeek: { candidate: number; recruiter: number; total: number };
    growthPercent: number;
  };
  activeJobPosts: {
    total: number;
    currentWeek: number;
    previousWeek: number;
    growthPercent: number;
  };
  pendingReview: {
    total: number;
    companyRegistrations: number;
    jobPosts: number;
  };
  totalUsers?: number; // Injected from parallel API calls
};

export type AdminRevenueChartData = {
  period: string;
  from: string;
  to: string;
  points: {
    label: string;
    from: string;
    to: string;
    revenue: number;
    invoices: number;
    plans: any[];
  }[];
};

export type AdminRecentActivity = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  status: string;
  jobStatus?: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
  };
};

export type AdminDashboardResponse = {
  summary: AdminDashboardSummary;
  revenueChart: AdminRevenueChartData;
  latestActivities: AdminRecentActivity[];
};

export async function getAdminDashboard(
  token: string,
  params?: AdminDashboardParams,
): Promise<AdminDashboardResponse> {
  const searchParams = new URLSearchParams();
  if (params?.chartPeriod) searchParams.set("chartPeriod", params.chartPeriod);
  if (params?.year) searchParams.set("year", params.year.toString());
  if (params?.month) searchParams.set("month", params.month.toString());
  if (params?.weekStart) searchParams.set("weekStart", params.weekStart);
  if (params?.activityLimit) searchParams.set("activityLimit", params.activityLimit.toString());

  const response = await apiRequest<any>(`/admin/dashboard?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle standard backend API wrapper { data: { ... } }
  if (response && response.data) {
    return response.data;
  }

  return response as AdminDashboardResponse;
}
