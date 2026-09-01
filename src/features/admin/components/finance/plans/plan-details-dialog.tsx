import { CheckCircle, XCircle } from "@phosphor-icons/react";

import type { SubscriptionPlan } from "@/features/recruiter/api/billing";
import { recruiterFeatureLimit } from "@/features/recruiter/api/plan-entitlements";
import { QUOTA_FEATURE_LABELS } from "@/features/recruiter/components/plan-feature-labels";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

type PlanDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  t: (key: string) => string;
};

/**
 * Shows the plan's real `PlanFeature` rows -- not a hand-written description
 * string. A row that says something the enforcement code does not check is a
 * promise nobody can verify, which is exactly the gap the business plan flags
 * as the most common failure mode of a pricing table.
 */
export function PlanDetailsDialog({ open, onOpenChange, plan, t }: PlanDetailsDialogProps) {
  if (!plan) return null;

  const isEmployer = plan.audience === "RECRUITER";
  const tone = isEmployer ? "brand" : "info";
  const audienceKey = isEmployer ? "employer" : "candidate";
  const statusKey = plan.status === "ACTIVE" ? "active" : "legacy";
  const planFeatures =
    isEmployer && !plan.features.some((feature) => feature.feature === "JOB_POST")
      ? [
          ...plan.features,
          {
            id: "platform-job-post",
            feature: "JOB_POST" as const,
            enabled: true,
            limitValue: null,
          },
        ]
      : plan.features;
  const enabledFeatures = planFeatures.filter(
    (feature) => feature.enabled || (isEmployer && feature.feature === "JOB_POST"),
  );
  const disabledFeatures = planFeatures.filter(
    (feature) => !feature.enabled && !(isEmployer && feature.feature === "JOB_POST"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone={tone}>{t(`targetAudienceOptions.${audienceKey}`)}</Badge>
            <Badge tone={plan.status === "ACTIVE" ? "success" : "neutral"}>
              {t(`statusOptions.${statusKey}`)}
            </Badge>
            {!plan.isPublic ? <Badge tone="warning">{t("isPrivateBadge")}</Badge> : null}
          </div>
          <DialogTitle className="text-2xl font-bold">{plan.subscriptionName}</DialogTitle>
          {plan.code ? (
            <p className="text-muted-foreground font-mono text-xs">{plan.code}</p>
          ) : null}
          <DialogDescription>
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
              Number(plan.price),
            )}{" "}
            / {plan.durationDays} {t("daysUnit")}
          </DialogDescription>
        </DialogHeader>

        {plan.description ? (
          <p className="text-muted-foreground text-sm">{plan.description}</p>
        ) : null}

        <div className="mt-4 space-y-6">
          <div>
            <h3 className="border-b pb-2 text-lg font-semibold">{t("features")}</h3>
            {enabledFeatures.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {enabledFeatures.map((feature) => {
                  const limit = recruiterFeatureLimit(feature.feature, feature.limitValue);
                  return (
                    <div key={feature.id} className="flex items-center gap-3">
                      <CheckCircle size={20} weight="fill" className="text-success shrink-0" />
                      <span className="text-foreground text-sm font-medium">
                        {QUOTA_FEATURE_LABELS[feature.feature]}
                      </span>
                      <span className="text-muted-foreground ml-auto text-sm">
                        {limit === null ? t("unlimitedValue") : `${limit}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground mt-4 text-sm italic">{t("noFeatures")}</p>
            )}
          </div>

          {disabledFeatures.length > 0 ? (
            <div>
              <h3 className="text-muted-foreground border-b pb-2 text-sm font-semibold">
                {t("notIncludedFeatures")}
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {disabledFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center gap-3">
                    <XCircle size={18} className="text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-sm">
                      {QUOTA_FEATURE_LABELS[feature.feature]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
