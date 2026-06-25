const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

const systemVi = {
  masterData: {
    title: "Dữ liệu gốc",
    subtitle: "Quản lý các danh mục lõi của hệ thống như Ngành nghề, Kỹ năng, Địa điểm, v.v.",
    addMasterData: "Thêm danh mục mới",
    table: {
      name: "Tên tập dữ liệu",
      category: "Phân loại",
      itemCount: "Số lượng Record",
      status: "Trạng thái",
      lastUpdated: "Cập nhật lần cuối",
      actions: "Thao tác",
      searchPlaceholder: "Tìm kiếm theo tên tập dữ liệu...",
      allStatuses: "Tất cả trạng thái",
      categoryOptions: {
        industry: "Ngành nghề",
        skill: "Kỹ năng",
        location: "Địa điểm",
        level: "Cấp bậc",
        type: "Loại hình",
      },
      statusOptions: {
        active: "Đang hoạt động",
        inactive: "Ngừng sử dụng",
      },
      actionOptions: {
        edit: "Chỉnh sửa dữ liệu",
        export: "Xuất Excel / CSV",
        deactivate: "Ngừng sử dụng",
        reactivate: "Kích hoạt lại",
      },
    },
  },
  roles: {
    title: "Phân quyền",
    subtitle: "Quản lý các nhóm quyền và thiết lập mức độ truy cập cho nhân sự nội bộ.",
    addRole: "Tạo vai trò mới",
    table: {
      name: "Vai trò",
      type: "Loại vai trò",
      userCount: "Số người dùng",
      status: "Trạng thái",
      actions: "Thao tác",
      searchPlaceholder: "Tìm kiếm theo tên vai trò...",
      allStatuses: "Tất cả trạng thái",
      typeOptions: {
        system: "Hệ thống",
        custom: "Tùy chỉnh",
      },
      statusOptions: {
        active: "Kích hoạt",
        inactive: "Vô hiệu hóa",
      },
      actionOptions: {
        editPermissions: "Chỉnh sửa quyền hạn (Permissions)",
        viewUsers: "Xem danh sách tài khoản",
        deactivate: "Vô hiệu hóa",
        reactivate: "Kích hoạt lại",
        delete: "Xóa vai trò",
      },
    },
  },
  auditLog: {
    title: "Nhật ký hệ thống",
    subtitle: "Lưu vết mọi thao tác thay đổi dữ liệu của nhân sự nội bộ vì mục đích bảo mật.",
    exportLog: "Xuất Log CSV",
    table: {
      timestamp: "Thời gian",
      user: "Người dùng (Actor)",
      action: "Loại thao tác",
      resource: "Đối tượng (Resource)",
      status: "Trạng thái",
      actions: "Chi tiết",
      searchPlaceholder: "Tìm kiếm theo người dùng hoặc đối tượng...",
      allActions: "Tất cả thao tác",
      actionOptions: {
        create: "Tạo mới",
        update: "Cập nhật",
        delete: "Xóa",
        login: "Đăng nhập",
        other: "Khác",
      },
      statusOptions: {
        success: "Thành công",
        failed: "Thất bại",
      },
      actionMenuOptions: {
        viewDetails: "Xem dữ liệu chi tiết (JSON)",
        viewHistory: "Xem lịch sử User này",
      },
    },
  },
};

const systemEn = {
  masterData: {
    title: "Master Data",
    subtitle: "Manage core system categories such as Industries, Skills, Locations, etc.",
    addMasterData: "Add New Category",
    table: {
      name: "Dataset Name",
      category: "Category",
      itemCount: "Record Count",
      status: "Status",
      lastUpdated: "Last Updated",
      actions: "Actions",
      searchPlaceholder: "Search by dataset name...",
      allStatuses: "All Statuses",
      categoryOptions: {
        industry: "Industry",
        skill: "Skill",
        location: "Location",
        level: "Level",
        type: "Type",
      },
      statusOptions: {
        active: "Active",
        inactive: "Inactive",
      },
      actionOptions: {
        edit: "Edit Data",
        export: "Export Excel / CSV",
        deactivate: "Deactivate",
        reactivate: "Reactivate",
      },
    },
  },
  roles: {
    title: "Roles & Permissions",
    subtitle: "Manage permission groups and set access levels for internal staff.",
    addRole: "Create New Role",
    table: {
      name: "Role",
      type: "Role Type",
      userCount: "User Count",
      status: "Status",
      actions: "Actions",
      searchPlaceholder: "Search by role name...",
      allStatuses: "All Statuses",
      typeOptions: {
        system: "System",
        custom: "Custom",
      },
      statusOptions: {
        active: "Active",
        inactive: "Inactive",
      },
      actionOptions: {
        editPermissions: "Edit Permissions",
        viewUsers: "View User List",
        deactivate: "Deactivate",
        reactivate: "Reactivate",
        delete: "Delete Role",
      },
    },
  },
  auditLog: {
    title: "Audit Log",
    subtitle: "Track all data modification actions by internal staff for security purposes.",
    exportLog: "Export CSV Log",
    table: {
      timestamp: "Timestamp",
      user: "User (Actor)",
      action: "Action Type",
      resource: "Resource",
      status: "Status",
      actions: "Details",
      searchPlaceholder: "Search by user or resource...",
      allActions: "All Actions",
      actionOptions: {
        create: "Create",
        update: "Update",
        delete: "Delete",
        login: "Login",
        other: "Other",
      },
      statusOptions: {
        success: "Success",
        failed: "Failed",
      },
      actionMenuOptions: {
        viewDetails: "View Details (JSON)",
        viewHistory: "View User History",
      },
    },
  },
};

function updateFile(filePath, systemData) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (!data.Admin) data.Admin = {};
  data.Admin.system = systemData;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Updated system in ${filePath}`);
}

updateFile(viPath, systemVi);
updateFile(enPath, systemEn);
