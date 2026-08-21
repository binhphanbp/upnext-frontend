import { describe, expect, it } from "vitest";

import { shouldRenderBuilderCvSnapshotForDownload } from "./cv-download";
import { createInitialCvData } from "./store";

describe("shouldRenderBuilderCvSnapshotForDownload", () => {
  it("renders the saved Builder snapshot even when the version has a stored PDF", () => {
    expect(
      shouldRenderBuilderCvSnapshotForDownload(
        { source: "BUILDER" },
        {
          contentJson: createInitialCvData(),
          sourceFile: {
            id: "stored-pdf",
            mimeType: "application/pdf",
            originalName: "old-export.pdf",
            publicUrl: null,
          },
        },
      ),
    ).toBe(true);
  });

  it("does not render an upload from a Builder snapshot", () => {
    expect(
      shouldRenderBuilderCvSnapshotForDownload(
        { source: "UPLOAD" },
        { contentJson: createInitialCvData(), sourceFile: null },
      ),
    ).toBe(false);
  });
});
