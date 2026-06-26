const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.system && data.Admin.system.roles) {
    data.Admin.system.roles.dialog = {
      title: isVi ? "Tạo Vai Trò Tùy Chỉnh" : "Create Custom Role",
      description: isVi
        ? "Tạo một Role mới và sau đó bạn có thể cấu hình chi tiết phân quyền (Permissions)."
        : "Create a new Role and then you can configure detailed permissions.",
      fields: {
        roleName: isVi ? "Tên vai trò" : "Role Name",
        roleNamePlaceholder: isVi ? "VD: Kế toán (Accounting)" : "Ex: Accounting",
        description: isVi ? "Mô tả ngắn" : "Short Description",
        descriptionPlaceholder: isVi
          ? "VD: Chỉ được phép xem lịch sử giao dịch"
          : "Ex: Can only view transaction history",
        cloneFrom: isVi ? "Kế thừa quyền từ (Tùy chọn)" : "Clone permissions from (Optional)",
        cloneFromPlaceholder: isVi ? "Chọn vai trò mẫu" : "Select template role",
      },
      cloneOptions: {
        none: isVi ? "-- Tạo quyền trống --" : "-- Create empty permissions --",
        moderator: isVi ? "Kế thừa từ: Moderator" : "Clone from: Moderator",
        sales: isVi ? "Kế thừa từ: Sales" : "Clone from: Sales",
        support: isVi ? "Kế thừa từ: Support" : "Clone from: Support",
      },
      buttons: {
        cancel: isVi ? "Hủy" : "Cancel",
        create: isVi ? "Tạo vai trò" : "Create Role",
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
