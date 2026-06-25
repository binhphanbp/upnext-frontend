const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

const financeVi = {
  plans: {
    title: "Gói dịch vụ",
    subtitle: "Cấu hình các gói Subscriptions và dịch vụ lẻ cho Nhà tuyển dụng & Ứng viên.",
    addPlan: "Thêm gói mới",
    table: {
      planName: "Tên gói dịch vụ",
      targetAudience: "Đối tượng",
      price: "Đơn giá",
      activeSubscribers: "Người dùng active",
      status: "Trạng thái",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo tên gói, mã ID...",
      allStatuses: "Tất cả trạng thái",
      targetAudienceOptions: {
        employer: "Nhà tuyển dụng",
        candidate: "Ứng viên",
      },
      billingCycleOptions: {
        month: "Tháng",
        year: "Năm",
        oneTime: "Gói tín dụng (One-time)",
      },
      statusOptions: {
        active: "Đang bán",
        legacy: "Ngừng bán (Legacy)",
        draft: "Bản nháp",
      },
      actionOptions: {
        edit: "Chỉnh sửa gói",
        viewSubscribers: "Xem danh sách người mua",
        publish: "Phát hành (Đưa lên bán)",
        retire: "Ngừng bán (Legacy)",
      },
    },
  },
  transactions: {
    title: "Lịch sử giao dịch",
    subtitle: "Theo dõi doanh thu, lịch sử thanh toán gói dịch vụ của Nhà tuyển dụng và Ứng viên.",
    table: {
      id: "Mã giao dịch",
      client: "Khách hàng",
      amount: "Số tiền",
      paymentMethod: "Phương thức thanh toán",
      status: "Trạng thái",
      transactionDate: "Thời gian",
      actions: "Thao tác",
      searchPlaceholder: "Tìm theo mã GD, khách hàng...",
      allStatuses: "Tất cả trạng thái",
      statusOptions: {
        success: "Thành công",
        processing: "Đang xử lý",
        failed: "Thất bại",
        refunded: "Đã hoàn tiền",
      },
      actionOptions: {
        viewInvoice: "Xem hóa đơn (Invoice)",
        resendEmail: "Gửi lại biên lai qua Email",
        recheckStatus: "Kiểm tra lại trạng thái GD",
        refund: "Hoàn tiền (Refund)",
      },
    },
  },
};

const financeEn = {
  plans: {
    title: "Service Plans",
    subtitle: "Configure Subscriptions and individual services for Employers & Candidates.",
    addPlan: "Add New Plan",
    table: {
      planName: "Plan Name",
      targetAudience: "Audience",
      price: "Price",
      activeSubscribers: "Active Subscribers",
      status: "Status",
      actions: "Actions",
      searchPlaceholder: "Search by plan name, ID...",
      allStatuses: "All Statuses",
      targetAudienceOptions: {
        employer: "Employer",
        candidate: "Candidate",
      },
      billingCycleOptions: {
        month: "Month",
        year: "Year",
        oneTime: "One-time",
      },
      statusOptions: {
        active: "Active",
        legacy: "Legacy (Retired)",
        draft: "Draft",
      },
      actionOptions: {
        edit: "Edit Plan",
        viewSubscribers: "View Subscribers",
        publish: "Publish",
        retire: "Retire Plan",
      },
    },
  },
  transactions: {
    title: "Transaction History",
    subtitle: "Monitor revenue and payment history for Employer and Candidate services.",
    table: {
      id: "Transaction ID",
      client: "Client",
      amount: "Amount",
      paymentMethod: "Payment Method",
      status: "Status",
      transactionDate: "Date",
      actions: "Actions",
      searchPlaceholder: "Search by transaction ID, client...",
      allStatuses: "All Statuses",
      statusOptions: {
        success: "Success",
        processing: "Processing",
        failed: "Failed",
        refunded: "Refunded",
      },
      actionOptions: {
        viewInvoice: "View Invoice",
        resendEmail: "Resend Receipt",
        recheckStatus: "Recheck Status",
        refund: "Refund",
      },
    },
  },
};

function updateFile(filePath, financeData) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (!data.Admin) data.Admin = {};
  data.Admin.finance = financeData;

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Updated finance in ${filePath}`);
}

updateFile(viPath, financeVi);
updateFile(enPath, financeEn);
