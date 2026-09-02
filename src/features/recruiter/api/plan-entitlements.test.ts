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
    expect(isUnlimitedRecruiterFeature("job_post")).toBe(true);
    expect(isRecruiterFeatureAvailable("job_post", enabled)).toBe(true);
    expect(recruiterFeatureLimit("job_post", limit)).toBeNull();
  });

  it("keeps paid-feature metadata meaningful", () => {
    expect(isRecruiterFeatureAvailable("ai_jd_generate", false)).toBe(false);
    expect(recruiterFeatureLimit("ai_jd_generate", 5)).toBe(5);
  });
});
