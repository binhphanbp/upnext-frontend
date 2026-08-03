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
});
