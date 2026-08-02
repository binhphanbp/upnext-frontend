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
  totalCandidates?: number;
  totalRecruiters?: number;
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

  const [dashboardRes, candidatesRes, companiesRes, recruitersRes, jobsRes, postsRes, reportsRes] =
    await Promise.all([
      apiRequest<any>(`/admin/dashboard?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      apiRequest<any>(`/candidate-accounts?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      apiRequest<any>(`/companies?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      apiRequest<any>(`/recruiter-accounts?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      apiRequest<any>(`/admin/job-posts?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      apiRequest<any>(`/admin/posts?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null),
      apiRequest<any>(`/admin/reports?limit=50`, {
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
    data.summary.totalCandidates = totalCandidates;
    data.summary.totalRecruiters = totalRecruiters;

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

  // Aggregate Activities
  const activities: AdminRecentActivity[] = [];

  if (recruitersRes?.items || Array.isArray(recruitersRes)) {
    const recruiters = Array.isArray(recruitersRes) ? recruitersRes : recruitersRes?.items || [];
    recruiters.forEach((r: any) => {
      activities.push({
        id: `recruiter-${r.id}`,
        type: "recruiter",
        title: r.email || r.profile?.fullName || "Nhà tuyển dụng",
        subtitle: "Đăng ký tài khoản",
        status: r.status === "ACTIVE" ? "approved" : r.status === "LOCKED" ? "rejected" : "pending",
        createdAt: r.createdAt || new Date().toISOString(),
      });
    });
  }

  if (candidatesRes?.items || Array.isArray(candidatesRes)) {
    const candidates = Array.isArray(candidatesRes) ? candidatesRes : candidatesRes?.items || [];
    candidates.forEach((c: any) => {
      activities.push({
        id: `candidate-${c.id}`,
        type: "candidate",
        title: c.profile?.fullName || c.email || "Ứng viên",
        subtitle: "Đăng ký tài khoản",
        status: c.status === "ACTIVE" ? "approved" : c.status === "LOCKED" ? "rejected" : "neutral",
        createdAt: c.createdAt || new Date().toISOString(),
      });
    });
  }

  if (companiesRes?.items || Array.isArray(companiesRes)) {
    const companies = Array.isArray(companiesRes) ? companiesRes : companiesRes?.items || [];
    companies.forEach((c: any) => {
      activities.push({
        id: `company-${c.id}`,
        type: "company",
        title: c.name || "Công ty mới",
        subtitle: "Đăng ký công ty",
        status:
          c.verificationStatus === "VERIFIED"
            ? "approved"
            : c.verificationStatus === "REJECTED"
              ? "rejected"
              : "pending",
        createdAt: c.createdAt || new Date().toISOString(),
      });
    });
  }

  if (jobsRes?.items || Array.isArray(jobsRes)) {
    const jobs = Array.isArray(jobsRes) ? jobsRes : jobsRes?.items || [];
    jobs.forEach((j: any) => {
      activities.push({
        id: `job-${j.id}`,
        type: "job",
        title: j.title || "Tin tuyển dụng",
        subtitle: j.company?.name || "Đăng tin",
        status:
          j.moderationStatus === "APPROVED"
            ? "approved"
            : j.moderationStatus === "REJECTED"
              ? "rejected"
              : "pending",
        createdAt: j.createdAt || new Date().toISOString(),
      });
    });
  }

  if (postsRes?.items || Array.isArray(postsRes)) {
    const posts = Array.isArray(postsRes) ? postsRes : postsRes?.items || [];
    posts.forEach((p: any) => {
      activities.push({
        id: `article-${p.id}`,
        type: "article",
        title: p.title || "Bài viết",
        subtitle: "Tạo bài viết",
        status:
          p.status === "PUBLISHED" ? "approved" : p.status === "DRAFT" ? "neutral" : "pending",
        createdAt: p.createdAt || new Date().toISOString(),
      });
    });
  }

  if (reportsRes?.items || Array.isArray(reportsRes)) {
    const reports = Array.isArray(reportsRes) ? reportsRes : reportsRes?.items || [];

    const targetTypeMap: Record<string, string> = {
      JOB_POST: "Tin tuyển dụng",
      COMPANY: "Công ty",
      CANDIDATE: "Ứng viên",
      USER: "Người dùng",
      ARTICLE: "Bài viết",
      POST: "Bài viết",
      COMMENT: "Bình luận",
    };

    const mockReasonMap: Record<string, string> = {
      "This article is plagiarized directly from another blog post.":
        "Bài viết này sao chép trực tiếp từ một blog khác.",
      "This profile contains highly inappropriate language and fake certificates.":
        "Hồ sơ này chứa ngôn từ không phù hợp và chứng chỉ giả mạo.",
      "The job description is misleading and looks like a scam.":
        "Mô tả công việc gây hiểu lầm và có dấu hiệu lừa đảo.",
      "Spam comments across multiple job posts.": "Bình luận rác (spam) trên nhiều tin tuyển dụng.",
      "Fake company profile using our logo without permission.":
        "Hồ sơ công ty giả mạo, sử dụng logo của chúng tôi trái phép.",
    };

    reports.forEach((r: any) => {
      const translatedSubtitle = r.targetType
        ? targetTypeMap[r.targetType] || r.targetType
        : "Kiểm duyệt";
      const translatedTitle = r.reason ? mockReasonMap[r.reason] || r.reason : "Báo cáo vi phạm";

      activities.push({
        id: `report-${r.id}`,
        type: "report",
        title: translatedTitle,
        subtitle: translatedSubtitle,
        status:
          r.status === "RESOLVED" ? "approved" : r.status === "REJECTED" ? "rejected" : "pending",
        createdAt: r.createdAt || new Date().toISOString(),
      });
    });
  }

  const filteredActivities = activities.filter((a) => a.status === "pending");

  filteredActivities.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  if (data) {
    data.latestActivities = filteredActivities;
  }

  return data as AdminDashboardResponse;
}
