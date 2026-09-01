const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.finance && data.Admin.finance.plans) {
    const table = data.Admin.finance.plans.table;

    table.planNames = {
      "PLAN-EMP-PRO": "Employer Pro",
      "PLAN-EMP-PREM": "Employer Premium",
      "PLAN-EMP-CRED": isVi ? "Gói AI Starter" : "AI Starter",
      "PLAN-CAN-PRO": isVi ? "Candidate Pro (Nổi bật hồ sơ)" : "Candidate Pro (Featured Profile)",
      "PLAN-EMP-BASIC-OLD": "Employer Basic (2025)",
      "PLAN-EMP-LITE": "Employer Lite",
      "PLAN-CAN-BASIC": "Candidate Basic",
      "PLAN-EMP-ENT": "Employer Enterprise",
      "PLAN-EMP-CRED-10": isVi ? "Gói AI Pro" : "AI Pro",
      "PLAN-CAN-MENTOR": "1:1 Mentorship",
      "PLAN-EMP-CV": isVi ? "Gói xem 100 CV" : "View 100 CVs Credit",
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
