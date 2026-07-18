const fs = require("fs");

const viPath = "./messages/vi.json";
const enPath = "./messages/en.json";

const vi = JSON.parse(fs.readFileSync(viPath, "utf-8"));
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));

if (!vi.AdminNav) vi.AdminNav = {};
vi.AdminNav.messages = {
  title: "Tin nhắn",
  supportChat: "Hỗ trợ & Chat",
};

if (!en.AdminNav) en.AdminNav = {};
en.AdminNav.messages = {
  title: "Messages",
  supportChat: "Support & Chat",
};

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log("Updated translations");
