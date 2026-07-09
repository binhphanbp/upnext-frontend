const fs = require("fs");
const data = JSON.parse(fs.readFileSync(".agents/openapi.json", "utf8"));
const out = [];
for (const [path, methods] of Object.entries(data.paths)) {
  if (path.includes("admin") || path.includes("moderation") || path.includes("job-posts")) {
    for (const [method, op] of Object.entries(methods)) {
      out.push(`${method.toUpperCase()} ${path} - ${op.summary}`);
    }
  }
}
fs.writeFileSync("api-output.json", JSON.stringify(out, null, 2));
