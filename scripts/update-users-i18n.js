const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

const usersVi = {
  employers: {
    title: "Nhà tuyển dụng",
    subtitle: "Quản lý tài khoản công ty, duyệt hồ sơ KYC và phân quyền gói dịch vụ.",
    addEmployer: "Thêm nhà tuyển dụng",
    table: {
      company: "Công ty",
      joined: "Tham gia: {date}",
      representative: "Đại diện liên hệ",
      plan: "Gói dịch vụ",
      status: "Trạng thái",
      activeJobs: "Tin tuyển dụng",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo tên công ty, email...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        pending: "Chờ duyệt",
        verified: "Đã xác thực",
        locked: "Bị khóa",
      },
      actionOptions: {
        copyId: "Copy ID Công ty",
        viewProfile: "Xem hồ sơ công ty",
        approve: "Duyệt tài khoản (KYC)",
        upgrade: "Nâng cấp gói dịch vụ",
        lock: "Khóa tài khoản",
      },
    },
    dialog: {
      title: "Thêm nhà tuyển dụng",
      description:
        "Tạo tài khoản nhà tuyển dụng mới trên hệ thống. Thông tin đăng nhập sẽ được gửi qua email.",
      companyName: "Tên công ty",
      companyNamePlaceholder: "Ví dụ: UpNext Technologies",
      email: "Email liên hệ",
      emailPlaceholder: "hr@upnext.com",
      plan: "Gói dịch vụ ban đầu",
      planPlaceholder: "Chọn gói",
      cancel: "Hủy bỏ",
      submit: "Tạo tài khoản",
    },
  },
  candidates: {
    title: "Ứng viên",
    subtitle: "Quản lý hồ sơ ứng viên, trạng thái tìm việc và hỗ trợ kỹ thuật.",
    table: {
      candidate: "Ứng viên",
      joined: "Tham gia: {date}",
      contact: "Thông tin liên hệ",
      status: "Trạng thái",
      applications: "Đã ứng tuyển",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo tên ứng viên, email...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        looking: "Đang tìm việc",
        open: "Mở cơ hội",
        closed: "Đã có việc",
        banned: "Bị cấm",
      },
      actionOptions: {
        viewProfile: "Xem hồ sơ ứng viên",
        viewApplications: "Lịch sử ứng tuyển",
        sendEmail: "Gửi email hỗ trợ",
        ban: "Cấm tài khoản",
      },
    },
  },
};

const usersEn = {
  employers: {
    title: "Employers",
    subtitle: "Manage company accounts, verify KYC profiles and assign service plans.",
    addEmployer: "Add Employer",
    table: {
      company: "Company",
      joined: "Joined: {date}",
      representative: "Representative",
      plan: "Service Plan",
      status: "Status",
      activeJobs: "Active Jobs",
      actions: "Actions",
      searchPlaceholder: "Search by company name, email...",
      allStatuses: "All Statuses",
      statusOptions: {
        pending: "Pending",
        verified: "Verified",
        locked: "Locked",
      },
      actionOptions: {
        copyId: "Copy Company ID",
        viewProfile: "View Company Profile",
        approve: "Approve Account (KYC)",
        upgrade: "Upgrade Service Plan",
        lock: "Lock Account",
      },
    },
    dialog: {
      title: "Add Employer",
      description:
        "Create a new employer account on the system. Login credentials will be sent via email.",
      companyName: "Company Name",
      companyNamePlaceholder: "E.g., UpNext Technologies",
      email: "Contact Email",
      emailPlaceholder: "hr@upnext.com",
      plan: "Initial Service Plan",
      planPlaceholder: "Select plan",
      cancel: "Cancel",
      submit: "Create Account",
    },
  },
  candidates: {
    title: "Candidates",
    subtitle: "Manage candidate profiles, job search status and provide technical support.",
    table: {
      candidate: "Candidate",
      joined: "Joined: {date}",
      contact: "Contact Info",
      status: "Status",
      applications: "Applications",
      actions: "Actions",
      searchPlaceholder: "Search by candidate name, email...",
      allStatuses: "All Statuses",
      statusOptions: {
        looking: "Actively Looking",
        open: "Open to Offers",
        closed: "Not Looking",
        banned: "Banned",
      },
      actionOptions: {
        viewProfile: "View Candidate Profile",
        viewApplications: "Application History",
        sendEmail: "Send Support Email",
        ban: "Ban Account",
      },
    },
  },
};

function updateFile(filePath, usersData) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (!data.Admin) data.Admin = {};
  data.Admin.users = usersData;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Updated users in ${filePath}`);
}

updateFile(viPath, usersVi);
updateFile(enPath, usersEn);
