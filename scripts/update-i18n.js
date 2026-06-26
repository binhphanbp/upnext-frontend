const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

const adminNavVi = {
  overview: {
    title: "Tổng quan",
    platformStats: "Thống kê nền tảng",
  },
  userManagement: {
    title: "Quản lý Người dùng",
    employers: "Nhà tuyển dụng",
    candidates: "Ứng viên",
  },
  operationsAndContent: {
    title: "Vận hành & Nội dung",
    jobs: "Quản lý tin đăng",
    articles: "Quản lý bài viết",
    moderation: "Kiểm duyệt nội dung",
    support: "Trung tâm hỗ trợ",
  },
  financeAndBusiness: {
    title: "Tài chính & Kinh doanh",
    plans: "Gói dịch vụ",
    transactions: "Hóa đơn",
  },
  systemAdmin: {
    title: "Quản trị Hệ thống",
    masterData: "Dữ liệu gốc",
    roles: "Phân quyền",
    auditLog: "Nhật ký hệ thống",
  },
};

const adminNavEn = {
  overview: {
    title: "Overview",
    platformStats: "Platform Statistics",
  },
  userManagement: {
    title: "User Management",
    employers: "Employers",
    candidates: "Candidates",
  },
  operationsAndContent: {
    title: "Operations & Content",
    jobs: "Job Posts",
    articles: "Articles",
    moderation: "Content Moderation",
    support: "Support Center",
  },
  financeAndBusiness: {
    title: "Finance & Business",
    plans: "Service Plans",
    transactions: "Invoices",
  },
  systemAdmin: {
    title: "System Administration",
    masterData: "Master Data",
    roles: "Roles & Permissions",
    auditLog: "Audit Log",
  },
};

const adminVi = {
  dashboard: {
    title: "Thống kê nền tảng",
    subtitle: "Tổng quan hiệu suất hoạt động và doanh thu của hệ thống UpNext.",
    downloadReport: "Tải báo cáo",
    totalRevenue: "Tổng doanh thu",
    comparedToLastMonth: "so với tháng trước",
    newUsers: "Người dùng mới",
    activeJobs: "Tin đang hoạt động",
    pendingApprovals: "Chờ kiểm duyệt",
    companies: "công ty",
    jobs: "tin đăng",
    revenueChart: {
      title: "Doanh thu",
      subtitle: "Doanh thu bán gói dịch vụ và tin đăng trong năm nay.",
    },
    recentActivity: {
      title: "Cần xử lý & Hoạt động",
      subtitle: "Các hoạt động mới nhất trên nền tảng cần quản trị viên xem xét.",
      status: {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Từ chối",
      },
      time: {
        hoursAgo: "{count} giờ trước",
        daysAgo: "{count} ngày trước",
      },
    },
  },
};

const adminEn = {
  dashboard: {
    title: "Platform Statistics",
    subtitle: "Overview of UpNext system performance and revenue.",
    downloadReport: "Download Report",
    totalRevenue: "Total Revenue",
    comparedToLastMonth: "vs last month",
    newUsers: "New Users",
    activeJobs: "Active Jobs",
    pendingApprovals: "Pending Approvals",
    companies: "companies",
    jobs: "jobs",
    revenueChart: {
      title: "Revenue",
      subtitle: "Revenue from service packages and job postings this year.",
    },
    recentActivity: {
      title: "To Do & Activities",
      subtitle: "Latest platform activities requiring admin review.",
      status: {
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
      },
      time: {
        hoursAgo: "{count} hours ago",
        daysAgo: "{count} days ago",
      },
    },
  },
};

function updateFile(filePath, adminNavData, adminData) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  data.AdminNav = adminNavData;
  data.Admin = adminData;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Updated ${filePath}`);
}

updateFile(viPath, adminNavVi, adminVi);
updateFile(enPath, adminNavEn, adminEn);
