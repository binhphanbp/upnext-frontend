const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.content && data.Admin.content.articles) {
    const table = data.Admin.content.articles.table;

    table.categoryOptions = {
      career: isVi ? "Phát triển nghề nghiệp" : "Career Development",
      technical: isVi ? "Góc kỹ thuật" : "Technical Corner",
      market: isVi ? "Báo cáo thị trường" : "Market Report",
      review: isVi ? "Review công ty" : "Company Review",
      news: isVi ? "Tin tức" : "News",
      blog: isVi ? "Blog" : "Blog",
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
