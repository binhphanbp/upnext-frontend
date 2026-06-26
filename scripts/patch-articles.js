const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.content && data.Admin.content.articles) {
    const table = data.Admin.content.articles.table;
    table.statusOptions.pending = isVi ? "Đang chờ duyệt" : "Pending";
    table.actionOptions.approveAndPublish = isVi ? "Duyệt và xuất bản" : "Approve & Publish";
    table.actionOptions.moveToDraft = isVi ? "Chuyển thành bản nháp" : "Move to Draft";

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
