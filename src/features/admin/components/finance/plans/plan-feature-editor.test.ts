import { describe, expect, it } from "vitest";

import { emptyFeatureFormState, toSetFeaturesPayload } from "./plan-feature-editor";

describe("toSetFeaturesPayload", () => {
  it("always preserves unlimited job posting for recruiter plans", () => {
    const state = emptyFeatureFormState();
    state.JOB_POST = { enabled: false, limitValue: "3" };

    expect(toSetFeaturesPayload(state, "RECRUITER")).toContainEqual({
      feature: "JOB_POST",
      enabled: true,
      limitValue: null,
    });
  });

  it("does not add a recruiter-only job-post feature to candidate plans", () => {
    const state = emptyFeatureFormState();

    expect(toSetFeaturesPayload(state, "CANDIDATE")).not.toContainEqual(
      expect.objectContaining({ feature: "JOB_POST" }),
    );
  });
});
