const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.system && data.Admin.system.roles && data.Admin.system.roles.table) {
    const table = data.Admin.system.roles.table;

    table.mockRoles = {
      "ROLE-ADMIN": {
        name: isVi ? "Quản trị viên cấp cao (Super Admin)" : "Super Administrator",
        description: isVi
          ? "Toàn quyền truy cập tất cả tính năng của hệ thống."
          : "Full access to all system features.",
      },
      "ROLE-MODERATOR": {
        name: isVi ? "Người kiểm duyệt (Moderator)" : "Moderator",
        description: isVi
          ? "Kiểm duyệt nội dung, báo cáo, tin tuyển dụng."
          : "Moderate content, reports, and job posts.",
      },
      "ROLE-SALES": {
        name: isVi ? "Nhân viên Kinh doanh (Sales)" : "Sales Representative",
        description: isVi
          ? "Quản lý khách hàng, gói dịch vụ và xem báo cáo kinh doanh."
          : "Manage clients, service plans, and view sales reports.",
      },
      "ROLE-SUPPORT": {
        name: isVi ? "Hỗ trợ Khách hàng (Customer Support)" : "Customer Support",
        description: isVi
          ? "Xử lý ticket và hỗ trợ người dùng."
          : "Handle tickets and support users.",
      },
      "ROLE-CUSTOM-01": {
        name: isVi ? "Thực tập sinh Marketing" : "Marketing Intern",
        description: isVi
          ? "Chỉ được xem và đăng bài viết PR."
          : "Can only view and publish PR articles.",
      },
      "ROLE-CUSTOM-02": {
        name: isVi ? "Cộng tác viên Nội dung" : "Content Contributor",
        description: isVi ? "Tạo bài viết nháp." : "Create draft articles.",
      },
      "ROLE-CUSTOM-03": {
        name: isVi ? "Tuyển dụng nội bộ" : "Internal Recruiter",
        description: isVi
          ? "Quản lý quy trình tuyển dụng nội bộ."
          : "Manage internal recruitment processes.",
      },
      "ROLE-CUSTOM-04": {
        name: isVi ? "Chuyên viên Phân tích" : "Data Analyst",
        description: isVi ? "Xem báo cáo dữ liệu." : "View data reports.",
      },
      "ROLE-CUSTOM-05": {
        name: isVi ? "Kế toán viên" : "Accountant",
        description: isVi ? "Quản lý hóa đơn và thanh toán." : "Manage invoices and payments.",
      },
      "ROLE-CUSTOM-06": {
        name: isVi ? "Chăm sóc Khách hàng VIP" : "VIP Account Manager",
        description: isVi
          ? "Hỗ trợ riêng cho tài khoản doanh nghiệp VIP."
          : "Exclusive support for VIP enterprise accounts.",
      },
      "ROLE-CUSTOM-07": {
        name: isVi ? "Quản trị viên IT" : "IT Administrator",
        description: isVi ? "Bảo trì hệ thống nội bộ." : "Maintain internal systems.",
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
