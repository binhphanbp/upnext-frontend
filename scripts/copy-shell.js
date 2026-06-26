const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function copyShell(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Recruiter && data.Recruiter.shell) {
    if (!data.Admin) data.Admin = {};
    data.Admin.shell = data.Recruiter.shell;

    // Customize some admin shell translations if needed
    if (filePath.includes("en.json")) {
      data.Admin.shell.loading = "Loading admin workspace...";
      data.Admin.shell.proPackage = "Pro Admin Features";
    } else {
      data.Admin.shell.loading = "Đang tải không gian quản trị...";
      data.Admin.shell.proPackage = "Tính năng nâng cao";
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Updated shell in ${filePath}`);
  }
}

copyShell(viPath);
copyShell(enPath);
