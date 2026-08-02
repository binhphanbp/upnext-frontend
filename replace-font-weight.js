const fs = require("fs");
const path = require("path");

const directories = [
  path.join(__dirname, "src/features/admin"),
  path.join(__dirname, "src/app/[locale]/(workspace)/admin"),
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith(".tsx") || file.endsWith(".ts")) {
        results.push(file);
      }
    }
  });
  return results;
}

let allFiles = [];
directories.forEach((dir) => {
  allFiles = allFiles.concat(walk(dir));
});

let modifiedCount = 0;

allFiles.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  let modified = false;

  const lines = content.split("\n");
  const newLines = lines.map((line) => {
    if (line.includes("font-bold")) {
      const isTitle = /<h[1-6]/.test(line) || /text-(lg|xl|2xl|3xl|4xl|5xl|6xl)/.test(line);
      if (!isTitle) {
        modified = true;
        return line.replace(/font-bold/g, "font-semibold");
      }
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(file, newLines.join("\n"), "utf8");
    modifiedCount++;
    console.log("Modified:", file);
  }
});

console.log("Total files modified:", modifiedCount);
