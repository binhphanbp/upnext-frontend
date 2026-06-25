const fs = require("fs");
const path = require("path");

const viPath = path.join(__dirname, "../messages/vi.json");
const enPath = path.join(__dirname, "../messages/en.json");

function patch(filePath, isVi) {
  const content = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);

  if (data.Admin && data.Admin.content && data.Admin.content.moderation) {
    const table = data.Admin.content.moderation.table;

    table.contentTypeOptions = {
      job: isVi ? "Tin tuyển dụng" : "Job Post",
      comment: isVi ? "Bình luận" : "Comment",
      review: isVi ? "Review công ty" : "Company Review",
      profile: isVi ? "Hồ sơ" : "Profile",
    };

    table.reasonOptions = {
      spam: isVi ? "Tin rác, lừa đảo" : "Spam, Scam",
      hateSpeech: isVi ? "Ngôn từ thù ghét, lăng mạ" : "Hate speech, Harassment",
      fakeInfo: isVi ? "Sử dụng thông tin giả mạo" : "Fake information",
      suspiciousLink: isVi ? "Chứa link đáng ngờ" : "Suspicious link",
      feeRequired: isVi ? "Yêu cầu đóng phí" : "Requires payment fee",
      gambling: isVi ? "Quảng cáo cá cược" : "Gambling advertisement",
      inappropriateAvatar: isVi ? "Avatar phản cảm" : "Inappropriate avatar",
      defamation: isVi ? "Bôi nhọ danh dự" : "Defamation",
      fakeJob: isVi ? "Việc làm không có thật" : "Fake job",
      profanity: isVi ? "Ngôn từ thô tục" : "Profanity",
      fakeReview: isVi ? "Review giả mạo" : "Fake review",
      invalidName: isVi ? "Tên chứa ký tự lạ" : "Name contains invalid characters",
      unknown: isVi ? "Lý do khác" : "Other reason",
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
}

patch(viPath, true);
patch(enPath, false);
