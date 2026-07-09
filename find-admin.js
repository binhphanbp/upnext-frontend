const fs = require("fs");
const data = JSON.parse(fs.readFileSync(".agents/openapi.json", "utf8"));
const admin = {};
for (const [path, methods] of Object.entries(data.paths)) {
  if (path.includes("admin")) {
    admin[path] = methods;
  }
}
fs.writeFileSync("admin.json", JSON.stringify(admin, null, 2));
