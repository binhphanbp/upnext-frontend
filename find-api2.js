const fs = require("fs");
const data = JSON.parse(fs.readFileSync(".agents/openapi.json", "utf8"));
const results = [];
for (const [path, methods] of Object.entries(data.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const str = JSON.stringify(op).toLowerCase();
    if (
      str.includes("từ chối") ||
      str.includes("reject") ||
      str.includes("duyệt") ||
      str.includes("moderation")
    ) {
      results.push(`${method.toUpperCase()} ${path} - ${op.summary}`);
    }
  }
}
fs.writeFileSync("api-output2.json", JSON.stringify(results, null, 2));
