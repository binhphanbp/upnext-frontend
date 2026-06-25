const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function updateCandidatesDict(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (
    data.Admin &&
    data.Admin.users &&
    data.Admin.users.candidates &&
    data.Admin.users.candidates.table
  ) {
    const table = data.Admin.users.candidates.table;

    // Add missing columns
    table.specialty = isVi ? "Chuyên môn" : "Specialty";
    table.joinedDate = isVi ? "Ngày tham gia" : "Joined Date";

    // Add missing action option
    if (table.actionOptions) {
      table.actionOptions.copyId = isVi ? "Copy ID Ứng viên" : "Copy Candidate ID";
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Fixed candidates dict in ${filePath}`);
  }
}

updateCandidatesDict(viPath, true);
updateCandidatesDict(enPath, false);
