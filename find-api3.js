const fs = require("fs");
const data = JSON.parse(fs.readFileSync(".agents/openapi.json", "utf8"));
const results = {};
for (const [path, methods] of Object.entries(data.paths)) {
  if (path.includes("job-post")) {
    results[path] = methods;
  }
}
fs.writeFileSync("job-post-api.json", JSON.stringify(results, null, 2));
