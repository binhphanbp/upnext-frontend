import { beforeEach, describe, expect, it } from "vitest";

import { createInitialCvData, useCvBuilderStore } from "./store";

describe("CV Builder draft hydration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useCvBuilderStore.setState({
      cvData: createInitialCvData(),
      draftSavedAt: null,
      future: [],
      past: [],
    });
  });

  it("does not make an automatic Profile import undo back to a blank CV", () => {
    const profileDraft = createInitialCvData();
    profileDraft.personalInfo = {
      ...profileDraft.personalInfo,
      email: "minhanh@example.com",
      fullName: "Nguyễn Minh Anh",
      phoneNumber: "0901234567",
      title: "Frontend Developer",
    };

    useCvBuilderStore.getState().hydrateCvData(profileDraft);

    expect(useCvBuilderStore.getState().past).toEqual([]);
    expect(useCvBuilderStore.getState().future).toEqual([]);
    expect(useCvBuilderStore.getState().cvData.personalInfo.fullName).toBe("Nguyễn Minh Anh");

    useCvBuilderStore.getState().updatePersonalInfo({ fullName: "Trần Minh Khoa" });
    useCvBuilderStore.getState().undo();

    expect(useCvBuilderStore.getState().cvData.personalInfo.fullName).toBe("Nguyễn Minh Anh");
  });

  it("gộp các lần gõ liên tiếp trong cùng một đợt thành một bước undo duy nhất", () => {
    useCvBuilderStore.getState().updateSummary("M");
    useCvBuilderStore.getState().updateSummary("Mì");
    useCvBuilderStore.getState().updateSummary("Mình");
    useCvBuilderStore.getState().updateSummary("Mình là");

    // Gõ 4 lần liên tiếp (giả lập gõ phím nhanh) chỉ tạo đúng một điểm undo —
    // không phải 4, nếu không Ctrl+Z sẽ lùi từng ký tự một cách vô dụng.
    expect(useCvBuilderStore.getState().past.length).toBe(1);

    useCvBuilderStore.getState().undo();
    expect(useCvBuilderStore.getState().cvData.summary).toBe("");
  });

  it("một đợt gõ mới (sau khi coi như tạm dừng) tạo thêm một bước undo riêng", () => {
    useCvBuilderStore.getState().updateSummary("Đợt một");
    // Giả lập một khoảng dừng đủ dài giữa hai đợt gõ bằng cách chỉnh thẳng
    // `lastHistoryPushAt` về quá khứ — không cần chờ thời gian thật trong test.
    useCvBuilderStore.setState({ lastHistoryPushAt: 0 });
    useCvBuilderStore.getState().updateSummary("Đợt hai");

    expect(useCvBuilderStore.getState().past.length).toBe(2);

    useCvBuilderStore.getState().undo();
    expect(useCvBuilderStore.getState().cvData.summary).toBe("Đợt một");
    useCvBuilderStore.getState().undo();
    expect(useCvBuilderStore.getState().cvData.summary).toBe("");
  });
});
