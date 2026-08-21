import { beforeEach, describe, expect, it } from "vitest";

import {
  fileSignature,
  payloadSignature,
  releaseRequestKey,
  resetRequestKeys,
  stableRequestKey,
} from "./job-post-ai-request-key";

describe("job post AI request key", () => {
  beforeEach(() => {
    resetRequestKeys();
  });

  // Đây là lý do khóa tồn tại: backend chỉ tránh được trừ lượt hai lần và gọi model
  // hai lần nếu hai request mang CÙNG một khóa.
  it("cùng ý định thì cùng khóa, nên bấm hai lần không tốn thêm lượt", () => {
    const signature = payloadSignature("generate", { title: "Senior React" });

    expect(stableRequestKey(signature)).toBe(stableRequestKey(signature));
  });

  it("đổi đầu vào thì đổi khóa", () => {
    const first = stableRequestKey(payloadSignature("generate", { title: "Senior React" }));
    const second = stableRequestKey(payloadSignature("generate", { title: "Junior React" }));

    expect(first).not.toBe(second);
  });

  it("cùng đầu vào nhưng khác thao tác thì khác khóa", () => {
    const generate = stableRequestKey(payloadSignature("generate", "abc"));
    const extract = stableRequestKey(payloadSignature("extract-text", "abc"));

    expect(generate).not.toBe(extract);
  });

  // Chỗ dễ sai nhất của cả cơ chế. Giữ khóa sau khi thành công thì người dùng bấm
  // "tạo lại" với cùng đầu vào sẽ nhận đúng bản nháp cũ từ cache và tưởng hỏng --
  // trong khi tạo lại để lấy bản khác là nhu cầu thật của người dùng AI.
  it("nhả khóa sau khi thành công thì lần bấm sau là một ý định mới", () => {
    const signature = payloadSignature("generate", { title: "Senior React" });
    const first = stableRequestKey(signature);

    releaseRequestKey(signature);

    expect(stableRequestKey(signature)).not.toBe(first);
  });

  // Sau khi lỗi thì KHÔNG nhả khóa: lần thử lại phải mang cùng khóa để backend biết
  // đó là cùng một thao tác, và để hai lần bấm liên tiếp lúc đang lỗi không thành hai
  // lần gọi model.
  it("không nhả khóa thì lần thử lại vẫn dùng đúng khóa cũ", () => {
    const signature = payloadSignature("generate", { title: "Senior React" });
    const first = stableRequestKey(signature);

    expect(stableRequestKey(signature)).toBe(first);
  });

  it("không tích lũy khóa vô hạn trong một tab sống lâu", () => {
    const first = payloadSignature("generate", { attempt: 0 });
    const firstKey = stableRequestKey(first);

    for (let attempt = 1; attempt <= 25; attempt += 1) {
      stableRequestKey(payloadSignature("generate", { attempt }));
    }

    // Khóa cũ nhất đã bị loại, nên lấy lại sẽ ra khóa khác.
    expect(stableRequestKey(first)).not.toBe(firstKey);
  });

  describe("fileSignature", () => {
    const asFile = (name: string, size: number, lastModified: number) =>
      ({ name, size, lastModified }) as File;

    it("cùng file thì cùng chữ ký", () => {
      expect(fileSignature("extract-file", asFile("jd.pdf", 1024, 1))).toBe(
        fileSignature("extract-file", asFile("jd.pdf", 1024, 1)),
      );
    });

    it("khác cỡ hoặc khác thời điểm sửa thì khác chữ ký", () => {
      const base = fileSignature("extract-file", asFile("jd.pdf", 1024, 1));

      expect(fileSignature("extract-file", asFile("jd.pdf", 2048, 1))).not.toBe(base);
      expect(fileSignature("extract-file", asFile("jd.pdf", 1024, 2))).not.toBe(base);
    });
  });
});
