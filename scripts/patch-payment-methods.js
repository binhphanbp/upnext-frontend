const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.finance && data.Admin.finance.transactions) {
    const table = data.Admin.finance.transactions.table;

    table.paymentMethodOptions = {
      bankTransfer: isVi ? "Chuyển khoản" : "Bank Transfer",
      creditCard: isVi ? "Thẻ tín dụng" : "Credit Card",
      momo: "MoMo",
      vnpay: "VNPAY",
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
