import { describe, expect, it } from "vitest";

import {
  isRecruiterFeatureAvailable,
  isUnlimitedRecruiterFeature,
  recruiterFeatureLimit,
} from "./plan-entitlements";

describe("recruiter job-post entitlement", () => {
  it.each([
    [undefined, undefined],
    [false, 1],
    [true, 30],
    [true, null],
  ] as const)("is unlimited even when plan metadata is legacy (%p, %p)", (enabled, limit) => {
    expect(isUnlimitedRecruiterFeature("JOB_POST")).toBe(true);
    expect(isRecruiterFeatureAvailable("JOB_POST", enabled)).toBe(true);
    expect(recruiterFeatureLimit("JOB_POST", limit)).toBeNull();
  });

  it("keeps paid-feature metadata meaningful", () => {
    expect(isRecruiterFeatureAvailable("AI_JD_GENERATE", false)).toBe(false);
    expect(recruiterFeatureLimit("AI_JD_GENERATE", 5)).toBe(5);
  });
});
