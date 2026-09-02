import type { SubscriptionFeature } from "./billing";

/**
 * Marketplace supply is not a paid entitlement. Keep this policy separate from
 * plan metadata so a delayed migration or a legacy API response cannot make a
 * recruiter-facing screen advertise a job-post quota again.
 */
export function isUnlimitedRecruiterFeature(feature: SubscriptionFeature) {
  return feature === "job_post";
}

export function isRecruiterFeatureAvailable(
  feature: SubscriptionFeature,
  enabled: boolean | undefined,
) {
  return isUnlimitedRecruiterFeature(feature) || enabled === true;
}

export function recruiterFeatureLimit(
  feature: SubscriptionFeature,
  limit: number | null | undefined,
) {
  return isUnlimitedRecruiterFeature(feature) ? null : (limit ?? null);
}
