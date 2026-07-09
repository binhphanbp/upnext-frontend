const fs = require("fs");
const data = JSON.parse(fs.readFileSync(".agents/openapi.json", "utf8"));
const results = [];
for (const [path, methods] of Object.entries(data.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    const str = JSON.stringify(op).toLowerCase();
    if (str.includes("reason") || str.includes("lý do") || str.includes("status")) {
      results.push(`${method.toUpperCase()} ${path} - ${op.summary}`);
    }
  }
}
fs.writeFileSync("find-api4.json", JSON.stringify(results, null, 2));
