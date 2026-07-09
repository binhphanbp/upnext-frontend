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

  const [dashboardRes, candidatesRes, companiesRes, recruitersRes] = await Promise.all([
    apiRequest<any>(`/admin/dashboard?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    apiRequest<any>(`/candidate-accounts?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null),
    apiRequest<any>(`/companies?limit=1000`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null),
    apiRequest<any>(`/recruiter-accounts?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null),
  ]);

  let data = dashboardRes;
  if (dashboardRes && dashboardRes.data) {
    data = dashboardRes.data;
  }

  // Inject totalUsers by summing up the totals from the 3 endpoints
  const totalCandidates = candidatesRes?.meta?.total || 0;
  const totalCompanies = companiesRes?.meta?.total || 0;
  const totalRecruiters = recruitersRes?.meta?.total || 0;

  if (data && data.summary) {
    data.summary.totalUsers = totalCandidates + totalCompanies + totalRecruiters;

    // Calculate pending companies since the dashboard API might not return it accurately yet
    if (companiesRes && companiesRes.items) {
      const pendingCompanies = companiesRes.items.filter(
        (c: any) => c.status !== "LOCKED" && c.verificationStatus !== "VERIFIED",
      ).length;

      if (!data.summary.pendingReview) {
        data.summary.pendingReview = { total: 0, companyRegistrations: 0, jobPosts: 0 };
      }

      data.summary.pendingReview.companyRegistrations = pendingCompanies;
      data.summary.pendingReview.total =
        data.summary.pendingReview.companyRegistrations +
        (data.summary.pendingReview.jobPosts || 0);
    }
  }

  return data as AdminDashboardResponse;
}
