const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.finance && data.Admin.finance.transactions) {
    const table = data.Admin.finance.transactions.table;

    table.mockServices = {
      "Employer Premium (1 Năm)": isVi ? "Employer Premium (1 Năm)" : "Employer Premium (1 Year)",
      "Employer Pro (1 Tháng)": isVi ? "Employer Pro (1 Tháng)" : "Employer Pro (1 Month)",
      "Gói AI Starter (1 Tháng)": isVi ? "Gói AI Starter (1 Tháng)" : "AI Starter (1 Month)",
      "Candidate Pro (1 Tháng)": isVi ? "Candidate Pro (1 Tháng)" : "Candidate Pro (1 Month)",
      "Candidate Pro": "Candidate Pro",
      "Gói AI Pro (1 Tháng)": isVi ? "Gói AI Pro (1 Tháng)" : "AI Pro (1 Month)",
      "Employer Enterprise": "Employer Enterprise",
      "1:1 Mentorship": "1:1 Mentorship",
      "Gói xem 100 CV": isVi ? "Gói xem 100 CV" : "View 100 CVs Credit",
    };

    table.mockClients = {
      "TechCorp Vietnam": "TechCorp Vietnam",
      "Global Outsource LLC": "Global Outsource LLC",
      "Startup B": "Startup B",
      "Nguyễn Lê Anh (Candidate)": isVi ? "Nguyễn Lê Anh (Ứng viên)" : "Nguyễn Lê Anh (Candidate)",
      "Scam Company": "Scam Company",
      "Công ty ABC": isVi ? "Công ty ABC" : "ABC Company",
      "Trần Văn E (Candidate)": isVi ? "Trần Văn E (Ứng viên)" : "Trần Văn E (Candidate)",
      "ZaloPay HR": "ZaloPay HR",
      "FPT Software": "FPT Software",
      "Shopee Vietnam": "Shopee Vietnam",
      "Phạm F (Candidate)": isVi ? "Phạm F (Ứng viên)" : "Phạm F (Candidate)",
      "Tiki HR": "Tiki HR",
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
