const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.finance && data.Admin.finance.plans) {
    data.Admin.finance.plans.dialog = {
      title: isVi ? "Tạo Gói Dịch Vụ Mới" : "Create New Service Plan",
      description: isVi
        ? "Thiết lập thông tin cơ bản cho gói dịch vụ (Subscription/Credit) mới trên hệ thống."
        : "Set up basic information for a new service plan (Subscription/Credit) on the system.",
      fields: {
        planName: isVi ? "Tên gói dịch vụ" : "Plan Name",
        planNamePlaceholder: isVi ? "VD: Employer Premium 2026" : "Ex: Employer Premium 2026",
        targetAudience: isVi ? "Đối tượng khách hàng" : "Target Audience",
        targetAudiencePlaceholder: isVi ? "Chọn đối tượng" : "Select audience",
        price: isVi ? "Đơn giá (VNĐ)" : "Price (VND)",
        pricePlaceholder: isVi ? "VD: 2500000" : "Ex: 2500000",
        billingCycle: isVi ? "Chu kỳ thanh toán" : "Billing Cycle",
        billingCyclePlaceholder: isVi ? "Chọn chu kỳ" : "Select billing cycle",
      },
      billingCycleOptions: {
        monthly: isVi ? "Hàng tháng (Monthly)" : "Monthly",
        yearly: isVi ? "Hàng năm (Yearly)" : "Yearly",
        oneTime: isVi ? "Gói tín dụng (One-time)" : "One-time Credit",
      },
      buttons: {
        cancel: isVi ? "Hủy" : "Cancel",
        createDraft: isVi ? "Tạo bản nháp" : "Create Draft",
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
