const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

const contentVi = {
  jobs: {
    title: "Tin tuyển dụng",
    subtitle: "Kiểm duyệt, quản lý hiển thị và gỡ bỏ các tin đăng tuyển dụng.",
    table: {
      job: "Công việc",
      locationAndType: "Khu vực & Loại hình",
      status: "Trạng thái",
      applicants: "Ứng tuyển",
      postedDate: "Ngày đăng",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo tiêu đề, công ty...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        active: "Đang hiển thị",
        pending: "Chờ duyệt",
        expired: "Hết hạn",
        rejected: "Đã từ chối",
      },
      actionOptions: {
        viewDetails: "Xem chi tiết tin",
        goToCompany: "Chuyển đến công ty",
        approve: "Duyệt tin đăng",
        reject: "Từ chối (Kèm lý do)",
        remove: "Gỡ tin (Ẩn khỏi site)",
      },
    },
  },
  articles: {
    title: "Bài viết & Cẩm nang",
    subtitle: "Quản lý bài viết blog, chia sẻ kinh nghiệm và hướng dẫn nghề nghiệp.",
    addArticle: "Viết bài mới",
    table: {
      article: "Bài viết",
      author: "Tác giả",
      views: "Lượt xem",
      status: "Trạng thái",
      date: "Ngày đăng",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo tiêu đề bài viết...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        published: "Đã xuất bản",
        draft: "Bản nháp",
        archived: "Lưu trữ",
      },
      actionOptions: {
        edit: "Chỉnh sửa bài viết",
        viewPreview: "Xem trước (Preview)",
        publish: "Xuất bản",
        archive: "Đưa vào lưu trữ",
        delete: "Xóa bài viết",
      },
    },
  },
  moderation: {
    title: "Kiểm duyệt nội dung",
    subtitle: "Xử lý các báo cáo vi phạm từ người dùng về tin đăng hoặc tài khoản.",
    table: {
      reportId: "ID Báo cáo",
      target: "Đối tượng bị báo cáo",
      reason: "Lý do báo cáo",
      reporter: "Người báo cáo",
      status: "Trạng thái",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo ID hoặc đối tượng...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        pending: "Chờ xử lý",
        reviewing: "Đang xem xét",
        resolved: "Đã giải quyết",
        dismissed: "Bỏ qua",
      },
      actionOptions: {
        viewDetails: "Xem chi tiết báo cáo",
        resolve: "Đánh dấu Đã giải quyết",
        dismiss: "Bỏ qua báo cáo",
        banTarget: "Khóa đối tượng vi phạm",
      },
    },
  },
  support: {
    title: "Trung tâm hỗ trợ",
    subtitle: "Quản lý và phản hồi các yêu cầu hỗ trợ từ người dùng hệ thống.",
    table: {
      ticket: "Ticket",
      requester: "Người yêu cầu",
      category: "Phân loại",
      status: "Trạng thái",
      updatedAt: "Cập nhật lần cuối",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo tiêu đề hoặc người yêu cầu...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        open: "Mở",
        inProgress: "Đang xử lý",
        waiting: "Chờ phản hồi",
        closed: "Đã đóng",
      },
      actionOptions: {
        reply: "Phản hồi yêu cầu",
        viewHistory: "Xem lịch sử ticket",
        close: "Đóng yêu cầu",
      },
    },
  },
};

const contentEn = {
  jobs: {
    title: "Job Posts",
    subtitle: "Moderate, manage visibility, and remove job postings.",
    table: {
      job: "Job",
      locationAndType: "Location & Type",
      status: "Status",
      applicants: "Applicants",
      postedDate: "Posted Date",
      actions: "Actions",
      searchPlaceholder: "Search by title, company...",
      allStatuses: "All Statuses",
      statusOptions: {
        active: "Active",
        pending: "Pending",
        expired: "Expired",
        rejected: "Rejected",
      },
      actionOptions: {
        viewDetails: "View Job Details",
        goToCompany: "Go to Company",
        approve: "Approve Job",
        reject: "Reject (with reason)",
        remove: "Remove (Hide from site)",
      },
    },
  },
  articles: {
    title: "Articles & Guides",
    subtitle: "Manage blog posts, career advice, and guidelines.",
    addArticle: "Write New Article",
    table: {
      article: "Article",
      author: "Author",
      views: "Views",
      status: "Status",
      date: "Date",
      actions: "Actions",
      searchPlaceholder: "Search by article title...",
      allStatuses: "All Statuses",
      statusOptions: {
        published: "Published",
        draft: "Draft",
        archived: "Archived",
      },
      actionOptions: {
        edit: "Edit Article",
        viewPreview: "Preview",
        publish: "Publish",
        archive: "Archive",
        delete: "Delete Article",
      },
    },
  },
  moderation: {
    title: "Content Moderation",
    subtitle: "Handle violation reports from users regarding job posts or accounts.",
    table: {
      reportId: "Report ID",
      target: "Reported Target",
      reason: "Reason",
      reporter: "Reporter",
      status: "Status",
      actions: "Actions",
      searchPlaceholder: "Search by ID or target...",
      allStatuses: "All Statuses",
      statusOptions: {
        pending: "Pending",
        reviewing: "Under Review",
        resolved: "Resolved",
        dismissed: "Dismissed",
      },
      actionOptions: {
        viewDetails: "View Report Details",
        resolve: "Mark as Resolved",
        dismiss: "Dismiss Report",
        banTarget: "Ban Offending Target",
      },
    },
  },
  support: {
    title: "Support Center",
    subtitle: "Manage and respond to support requests from system users.",
    table: {
      ticket: "Ticket",
      requester: "Requester",
      category: "Category",
      status: "Status",
      updatedAt: "Last Updated",
      actions: "Actions",
      searchPlaceholder: "Search by title or requester...",
      allStatuses: "All Statuses",
      statusOptions: {
        open: "Open",
        inProgress: "In Progress",
        waiting: "Waiting on User",
        closed: "Closed",
      },
      actionOptions: {
        reply: "Reply to Request",
        viewHistory: "View Ticket History",
        close: "Close Ticket",
      },
    },
  },
};

function updateFile(filePath, contentData) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (!data.Admin) data.Admin = {};
  data.Admin.content = contentData;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Updated content in ${filePath}`);
}

updateFile(viPath, contentVi);
updateFile(enPath, contentEn);
