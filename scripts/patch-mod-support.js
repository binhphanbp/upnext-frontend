const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.content) {
    if (data.Admin.content.moderation) {
      const table = data.Admin.content.moderation.table;
      table.contentType = isVi ? "Loại nội dung" : "Content Type";
      table.reportedDate = isVi ? "Ngày báo cáo" : "Reported Date";
      table.actionOptions.viewDetails = isVi
        ? "Xem chi tiết nội dung bị báo cáo"
        : "View Reported Content Details";
      table.actionOptions.viewReporter = isVi ? "Xem người báo cáo" : "View Reporter";
      table.actionOptions.resolveAndRemove = isVi
        ? "Giải quyết (Xóa nội dung)"
        : "Resolve (Remove Content)";
      table.actionOptions.dismiss = isVi ? "Từ chối báo cáo (Bỏ qua)" : "Dismiss Report";
    }

    if (data.Admin.content.support) {
      const table = data.Admin.content.support.table;
      table.subject = isVi ? "Tiêu đề yêu cầu" : "Subject";
      table.user = isVi ? "Người dùng" : "User";
      table.priority = isVi ? "Mức độ ưu tiên" : "Priority";
      table.createdDate = isVi ? "Thời gian tạo" : "Created Date";

      table.priorityOptions = {
        high: isVi ? "Cao" : "High",
        medium: isVi ? "Trung bình" : "Medium",
        low: isVi ? "Thấp" : "Low",
      };

      table.actionOptions.viewDetails = isVi ? "Xem chi tiết Ticket" : "View Ticket Details";
      table.actionOptions.viewUser = isVi ? "Xem thông tin User" : "View User Info";
      table.actionOptions.markInProgress = isVi
        ? "Chuyển trạng thái: Đang xử lý"
        : "Mark as In Progress";
      table.actionOptions.close = isVi ? "Đóng Ticket (Đã xử lý xong)" : "Close Ticket (Resolved)";
      table.actionOptions.reopen = isVi ? "Mở lại Ticket" : "Reopen Ticket";
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
