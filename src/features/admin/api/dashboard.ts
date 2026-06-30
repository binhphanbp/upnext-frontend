import { apiRequest } from "@/shared/api/http";

export type AdminDashboardParams = {
  chartPeriod?: "week" | "month" | "year";
  year?: number;
  month?: number;
  weekStart?: string;
  activityLimit?: number;
};

export type AdminDashboardStat = {
  value: number;
  percentChange?: number;
};

export type AdminDashboardStats = {
  totalRevenue?: AdminDashboardStat;
  newUsers: AdminDashboardStat;
  activeJobs: AdminDashboardStat;
  pendingApprovals: {
    total: number;
    companies: number;
    jobs: number;
  };
};

export type AdminRevenueChartData = {
  name: string;
  total: number;
};

export type AdminRecentActivity = {
  id: string;
  entity: string;
  type: string;
  status: "pending" | "approved" | "rejected" | string;
  time: string;
};

export type AdminDashboardResponse = {
  stats: AdminDashboardStats;
  revenueChart: AdminRevenueChartData[];
  recentActivity: AdminRecentActivity[];
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
