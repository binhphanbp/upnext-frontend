import { describe, expect, it } from "vitest";

import { getJobPreviewDescription } from "./job-preview-description";

describe("getJobPreviewDescription", () => {
  it("keeps paragraphs and list items readable while removing rich HTML wrappers", () => {
    expect(
      getJobPreviewDescription(`
        <details open>
          <summary><strong>Mô tả công việc</strong></summary>
          <p>Xây dựng trải nghiệm tìm việc dễ sử dụng.</p>
          <ul><li>Tối ưu hiệu năng.</li><li>Phối hợp cùng đội ngũ.</li></ul>
        </details>
      `),
    ).toBe(
      "Xây dựng trải nghiệm tìm việc dễ sử dụng.\n• Tối ưu hiệu năng.\n• Phối hợp cùng đội ngũ.",
    );
  });

  it("returns undefined when the source has no meaningful content", () => {
    expect(getJobPreviewDescription("<details><summary>Mô tả công việc</summary></details>")).toBe(
      undefined,
    );
  });
});
