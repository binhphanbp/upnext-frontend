const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.content && data.Admin.content.jobs) {
    const table = data.Admin.content.jobs.table;

    table.typeOptions = {
      fullTime: isVi ? "Toàn thời gian" : "Full-time",
      partTime: isVi ? "Bán thời gian" : "Part-time",
      internship: isVi ? "Thực tập" : "Internship",
      other: isVi ? "Khác" : "Other",
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
