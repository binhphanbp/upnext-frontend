const fs = require("fs");
const data = JSON.parse(fs.readFileSync(".agents/openapi.json", "utf8"));
const lines = [];
for (const [path, methods] of Object.entries(data.paths)) {
  for (const [method, op] of Object.entries(methods)) {
    lines.push(`${method.toUpperCase()} ${path} - ${op.summary}`);
  }
}
fs.writeFileSync("all-operations.txt", lines.join("\n"));
