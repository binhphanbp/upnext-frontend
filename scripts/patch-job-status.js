const fs = require("fs");

function updateJson(filePath, newKey, newValue) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (
    data.Admin &&
    data.Admin.content &&
    data.Admin.content.jobs &&
    data.Admin.content.jobs.table &&
    data.Admin.content.jobs.table.statusOptions
  ) {
    data.Admin.content.jobs.table.statusOptions[newKey] = newValue;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Could not find the correct path in ${filePath}`);
  }
}

updateJson("messages/vi.json", "hidden", "Đã ẩn");
updateJson("messages/en.json", "hidden", "Hidden");
