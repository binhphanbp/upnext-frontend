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

  it("replaces stale local undo history when an explicit saved CV is opened", () => {
    useCvBuilderStore.getState().updateSummary("Bản nháp chỉ có trên thiết bị");

    const savedCvSnapshot = createInitialCvData();
    savedCvSnapshot.summary = "Bản CV đã lưu trên UpNext";
    savedCvSnapshot.personalInfo.fullName = "Nguyễn Minh Anh";
    useCvBuilderStore.getState().hydrateCvData(savedCvSnapshot);

    expect(useCvBuilderStore.getState().past).toEqual([]);
    expect(useCvBuilderStore.getState().future).toEqual([]);
    expect(useCvBuilderStore.getState().cvData.summary).toBe("Bản CV đã lưu trên UpNext");

    useCvBuilderStore.getState().updateSummary("Bản CV đã chỉnh sửa");
    useCvBuilderStore.getState().undo();

    expect(useCvBuilderStore.getState().cvData.summary).toBe("Bản CV đã lưu trên UpNext");
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

  it("cho mỗi lần xoá một bước undo riêng, dù bấm liên tiếp", () => {
    useCvBuilderStore.getState().addSkill();
    useCvBuilderStore.getState().addSkill();
    useCvBuilderStore.getState().addSkill();
    const ids = useCvBuilderStore.getState().cvData.skills.map((skill) => skill.id);
    const before = useCvBuilderStore.getState().past.length;

    // Ba lần bấm xoá nhanh hơn cửa sổ gộp. Nếu chúng bị gộp như các ký tự gõ thì
    // một lần Ctrl+Z sẽ khôi phục cả ba — người dùng mất dữ liệu ngoài ý muốn.
    for (const id of ids) useCvBuilderStore.getState().deleteSkill(id);

    expect(useCvBuilderStore.getState().cvData.skills).toHaveLength(0);
    expect(useCvBuilderStore.getState().past.length).toBe(before + 3);

    useCvBuilderStore.getState().undo();
    expect(useCvBuilderStore.getState().cvData.skills).toHaveLength(1);
  });

  it("không nhập ký tự gõ ngay sau một thao tác rời rạc vào cùng bước với nó", () => {
    useCvBuilderStore.getState().addExperience();
    const after = useCvBuilderStore.getState().past.length;

    // Gõ ngay sau khi thêm mục: nếu đợt gõ nối tiếp thao tác thêm, Ctrl+Z sẽ xoá
    // luôn mục vừa tạo thay vì chỉ hoàn tác phần vừa gõ.
    useCvBuilderStore.getState().updateSummary("Vừa gõ");

    expect(useCvBuilderStore.getState().past.length).toBe(after + 1);
    useCvBuilderStore.getState().undo();
    expect(useCvBuilderStore.getState().cvData.summary).toBe("");
    expect(useCvBuilderStore.getState().cvData.experiences).toHaveLength(1);
  });
});
