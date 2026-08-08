import { describe, expect, it } from "vitest";

import type { CandidateCvApi } from "./api/profile";
import { getLatestCandidateCvVersion, resolveCandidateCvSelection } from "./cv-selection";

const defaultCv: CandidateCvApi = {
  createdAt: "2026-08-01T08:00:00.000Z",
  id: "default-cv",
  isDefault: true,
  source: "UPLOAD",
  status: "ACTIVE",
  title: "CV mặc định.pdf",
  updatedAt: "2026-08-01T08:00:00.000Z",
  version: 1,
  versions: [
    {
      createdAt: "2026-08-01T08:00:00.000Z",
      id: "default-version",
      sourceFile: null,
      sourceFileId: null,
      versionNo: 1,
    },
  ],
};

const uploadedCv: CandidateCvApi = {
  ...defaultCv,
  createdAt: "2026-08-04T08:00:00.000Z",
  id: "uploaded-cv",
  isDefault: false,
  title: "CV vừa tải lên.pdf",
  updatedAt: "2026-08-04T08:00:00.000Z",
  versions: [
    {
      createdAt: "2026-08-03T08:00:00.000Z",
      id: "older-version",
      versionNo: 1,
      sourceFile: null,
      sourceFileId: null,
    },
    {
      createdAt: "2026-08-04T08:00:00.000Z",
      id: "newest-version",
      versionNo: 2,
      sourceFile: null,
      sourceFileId: null,
    },
  ],
};

describe("resolveCandidateCvSelection", () => {
  it("keeps the CV explicitly selected after the CV list refreshes", () => {
    expect(resolveCandidateCvSelection([defaultCv, uploadedCv], uploadedCv.id)).toBe(uploadedCv.id);
  });

  it("uses the default CV only when there is no valid existing selection", () => {
    expect(resolveCandidateCvSelection([uploadedCv, defaultCv], null)).toBe(defaultCv.id);
    expect(resolveCandidateCvSelection([uploadedCv, defaultCv], "deleted-cv")).toBe(defaultCv.id);
  });

  it("uses the most recent CV version for an uploaded document", () => {
    expect(getLatestCandidateCvVersion(uploadedCv)?.id).toBe("newest-version");
  });

  it("never selects a draft CV for an application", () => {
    const draftCv: CandidateCvApi = {
      ...uploadedCv,
      id: "draft-cv",
      isDefault: true,
      status: "DRAFT",
    };

    expect(resolveCandidateCvSelection([draftCv, uploadedCv], draftCv.id)).toBe(uploadedCv.id);
  });
});
