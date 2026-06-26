const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.system) {
    if (data.Admin.system.masterData) {
      data.Admin.system.masterData.dialog = {
        title: isVi ? "Tạo Bộ Dữ Liệu Gốc (Master Data)" : "Create Master Dataset",
        description: isVi
          ? "Thiết lập danh mục lõi mới để sử dụng trong toàn bộ hệ thống nền tảng."
          : "Configure a new core category for use across the platform.",
        fields: {
          datasetName: isVi ? "Tên bộ dữ liệu" : "Dataset Name",
          datasetNamePlaceholder: isVi ? "VD: Danh sách Bằng cấp" : "Ex: Degree List",
          category: isVi ? "Phân loại (Category)" : "Category",
          categoryPlaceholder: isVi ? "Chọn phân loại" : "Select category",
          dataCode: isVi ? "Mã tham chiếu (Code)" : "Reference Code",
          dataCodePlaceholder: isVi ? "VD: DEGREE_LIST" : "Ex: DEGREE_LIST",
          description: isVi ? "Mô tả ngắn gọn" : "Short Description",
          descriptionPlaceholder: isVi
            ? "VD: Dùng cho dropdown Bằng cấp ở hồ sơ"
            : "Ex: Used for Degree dropdown in profile",
        },
        categoryOptions: {
          industry: isVi ? "Ngành nghề" : "Industry",
          skill: isVi ? "Kỹ năng (Skills)" : "Skills",
          location: isVi ? "Địa điểm" : "Location",
          level: isVi ? "Cấp bậc" : "Level",
          type: isVi ? "Loại hình công việc" : "Work Type",
          other: isVi ? "Khác" : "Other",
        },
        buttons: {
          cancel: isVi ? "Hủy" : "Cancel",
          create: isVi ? "Khởi tạo dữ liệu" : "Initialize Data",
        },
      };
    }

    if (data.Admin.system.roles) {
      data.Admin.system.roles.dialog = {
        title: isVi ? "Tạo Vai Trò (Role) Mới" : "Create New Role",
        description: isVi
          ? "Thiết lập một nhóm quyền hạn mới để phân bổ cho nhân sự hệ thống."
          : "Configure a new permission group to assign to system personnel.",
        fields: {
          roleName: isVi ? "Tên vai trò" : "Role Name",
          roleNamePlaceholder: isVi ? "VD: Kế toán trưởng" : "Ex: Chief Accountant",
          roleType: isVi ? "Phân loại nhóm quyền" : "Role Type",
          roleTypePlaceholder: isVi ? "Chọn loại nhóm quyền" : "Select role type",
          roleCode: isVi ? "Mã tham chiếu (Code)" : "Reference Code",
          roleCodePlaceholder: isVi ? "VD: ROLE_CHIEF_ACC" : "Ex: ROLE_CHIEF_ACC",
          description: isVi ? "Mô tả vai trò" : "Role Description",
          descriptionPlaceholder: isVi
            ? "VD: Có quyền xem và phê duyệt hóa đơn"
            : "Ex: Can view and approve invoices",
        },
        typeOptions: {
          system: isVi ? "Quyền hệ thống (Không thể xóa)" : "System Role (Undeletable)",
          custom: isVi ? "Quyền tùy chỉnh (Có thể sửa/xóa)" : "Custom Role (Modifiable)",
        },
        buttons: {
          cancel: isVi ? "Hủy" : "Cancel",
          create: isVi ? "Tạo vai trò" : "Create Role",
        },
      };
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
