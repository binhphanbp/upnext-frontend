"use client";

import { useTranslations } from "next-intl";

import {
  SUBSCRIPTION_FEATURES,
  type PlanAudience,
  type SubscriptionFeature,
} from "@/features/recruiter/api/billing";
import { QUOTA_FEATURE_LABELS } from "@/features/recruiter/components/plan-feature-labels";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

/** Empty string means "no limit set yet" in the form, distinct from `0`. */
export type PlanFeatureFormState = Record<
  SubscriptionFeature,
  { enabled: boolean; limitValue: string }
>;

export function emptyFeatureFormState(): PlanFeatureFormState {
  return Object.fromEntries(
    SUBSCRIPTION_FEATURES.map((feature) => [feature, { enabled: false, limitValue: "" }]),
  ) as PlanFeatureFormState;
}

/** Backend rows -> form state, used when opening the edit dialog on an existing plan. */
export function featureFormStateFromPlan(
  features: ReadonlyArray<{
    feature: SubscriptionFeature;
    enabled: boolean;
    limitValue: number | null;
  }>,
): PlanFeatureFormState {
  const state = emptyFeatureFormState();
  for (const row of features) {
    state[row.feature] = {
      enabled: row.enabled,
      limitValue: row.limitValue === null ? "" : String(row.limitValue),
    };
  }
  return state;
}

/**
 * Form state -> the payload `PUT /subscription-plans/:id/features` expects.
 *
 * Only enabled features are sent: a disabled feature with a stray number in its
 * limit field should not resurrect a `limitValue` the admin never meant to keep.
 * Empty limit means unlimited (`null`), matching how the backend already reads it.
 */
export function toSetFeaturesPayload(state: PlanFeatureFormState, audience: PlanAudience) {
  const editableFeatures = SUBSCRIPTION_FEATURES.filter((feature) => feature !== "job_post");
  const payload: Array<{
    feature: SubscriptionFeature;
    enabled: boolean;
    limitValue: number | null;
  }> = editableFeatures
    .filter((feature) => state[feature].enabled)
    .map((feature) => {
      const raw = state[feature].limitValue.trim();
      return {
        feature,
        enabled: true,
        limitValue: raw === "" ? null : Number(raw),
      };
    });

  // Job posting is always available and unlimited for recruiters. The server
  // enforces this invariant too; including it here keeps admin saves explicit.
  if (audience === "RECRUITER") {
    payload.push({ feature: "job_post", enabled: true, limitValue: null });
  }
  return payload;
}

type PlanFeatureEditorProps = {
  audience: PlanAudience;
  value: PlanFeatureFormState;
  onChange: (next: PlanFeatureFormState) => void;
};

/**
 * The real `SubscriptionFeature` enum, editable as enabled + limit -- replacing
 * the previous mock form's hand-written feature blocks. Those blocks did not map
 * to anything the backend enforces, and one of them ("Ưu tiên hiển thị với Nhà
 * tuyển dụng") was a ranking-boost toggle the business plan explicitly forbids
 * (a paid plan must never change search ranking). A generic editor over the real
 * enum cannot reintroduce that: there is no feature key for it to expose.
 */
export function PlanFeatureEditor({ audience, value, onChange }: PlanFeatureEditorProps) {
  const t = useTranslations("Admin.finance.plans.dialog.features");

  const setFeature = (
    feature: SubscriptionFeature,
    patch: Partial<{ enabled: boolean; limitValue: string }>,
  ) => {
    onChange({ ...value, [feature]: { ...value[feature], ...patch } });
  };

  return (
    <div className="flex flex-col gap-3">
      {SUBSCRIPTION_FEATURES.filter(
        (feature) => audience === "RECRUITER" || feature !== "job_post",
      ).map((feature) => {
        const row = value[feature];
        const isPlatformJobPosting = audience === "RECRUITER" && feature === "job_post";
        return (
          <div key={feature} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
            {isPlatformJobPosting ? (
              <span className="flex size-4 shrink-0 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold text-white">
                ✓
              </span>
            ) : (
              <Checkbox
                id={`feature-${feature}`}
                checked={row.enabled}
                onCheckedChange={(checked) => setFeature(feature, { enabled: checked === true })}
              />
            )}
            <Label
              htmlFor={isPlatformJobPosting ? undefined : `feature-${feature}`}
              className="min-w-[220px] flex-1 cursor-pointer"
            >
              {QUOTA_FEATURE_LABELS[feature]}
            </Label>
            {isPlatformJobPosting ? (
              <span className="text-xs font-semibold text-emerald-700">
                {t("platformUnlimited")}
              </span>
            ) : (
              <>
                <Input
                  type="number"
                  min={0}
                  className="h-9 w-32"
                  placeholder={t("unlimitedPlaceholder")}
                  disabled={!row.enabled}
                  value={row.limitValue}
                  onChange={(event) => setFeature(feature, { limitValue: event.target.value })}
                />
                <span className="text-muted-foreground text-xs">{t("unlimitedHint")}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
