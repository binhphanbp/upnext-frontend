"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import Swal from "sweetalert2";

import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import {
  setPlanFeatures,
  updateSubscriptionPlan,
  type SubscriptionPlan,
} from "@/features/recruiter/api/billing";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

import {
  emptyFeatureFormState,
  featureFormStateFromPlan,
  PlanFeatureEditor,
  toSetFeaturesPayload,
  type PlanFeatureFormState,
} from "./plan-feature-editor";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
});

type FormState = {
  subscriptionName: string;
  price: string;
  durationDays: string;
  description: string;
  isPublic: boolean;
  sortOrder: string;
  highlightLabel: string;
};

function formStateFromPlan(plan: SubscriptionPlan): FormState {
  return {
    subscriptionName: plan.subscriptionName,
    price: plan.price,
    durationDays: String(plan.durationDays),
    description: plan.description ?? "",
    isPublic: plan.isPublic,
    sortOrder: String(plan.sortOrder),
    highlightLabel: plan.highlightLabel ?? "",
  };
}

type EditPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
};

/**
 * `code` and `audience` are shown read-only, never editable here -- matching the
 * backend, which omits both from `UpdateSubscriptionPlanDto` on purpose. Getting
 * either wrong on a live plan is fixed by retiring it and creating a new one, not
 * by editing in place: `code` is what tier-based logic and data migrations
 * reference, and `audience` decides who is allowed to buy the plan.
 */
export function EditPlanDialog({ open, onOpenChange, plan }: EditPlanDialogProps) {
  const [form, setForm] = useState<FormState>(() =>
    plan ? formStateFromPlan(plan) : ({} as FormState),
  );
  const [features, setFeatures] = useState<PlanFeatureFormState>(emptyFeatureFormState());

  const t = useTranslations("Admin.finance.plans.dialog");
  const tPlans = useTranslations("Admin.finance.plans.table");
  const queryClient = useQueryClient();
  const router = useRouter();

  // Re-seed the form whenever a different plan is opened, or when this plan's
  // own data changes underneath it (e.g. a feature save just completed).
  useEffect(() => {
    if (!plan) return;
    setForm(formStateFromPlan(plan));
    setFeatures(featureFormStateFromPlan(plan.features));
  }, [plan]);

  const handleAuthError = (error: unknown): boolean => {
    if (error instanceof Error && error.message === "No session") {
      router.replace("/admin/login");
      return true;
    }
    if (error instanceof ApiError && error.status === 401) {
      clearAdminSession();
      router.replace("/admin/login");
      return true;
    }
    return false;
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error("No plan");
      const session = getAdminSession();
      if (!session) throw new Error("No session");

      await updateSubscriptionPlan(
        plan.id,
        {
          subscriptionName: form.subscriptionName.trim(),
          price: Number(form.price),
          durationDays: Number(form.durationDays),
          description: form.description.trim() || undefined,
          isPublic: form.isPublic,
          sortOrder: Number(form.sortOrder) || 0,
          highlightLabel: form.highlightLabel.trim() || null,
        },
        session.accessToken,
      );

      // Full replace, matching how the backend endpoint works: features left out
      // of this payload are removed from the plan, which is what makes this a
      // simple full-state save instead of a diff.
      await setPlanFeatures(
        plan.id,
        toSetFeaturesPayload(features, plan.audience),
        session.accessToken,
      );
    },
    onSuccess: () => {
      void toast.fire({ icon: "success", title: t("toasts.updateSuccess") });
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptionPlans"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (handleAuthError(error)) return;
      const message = error instanceof ApiError ? error.message : t("toasts.updateError");
      void toast.fire({ icon: "error", title: message });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("editTitle")}</DialogTitle>
            <DialogDescription>{t("editDescription")}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
            <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3 md:col-span-2">
              <span className="text-muted-foreground text-xs">{t("fields.code")}</span>
              <span className="font-mono text-sm">{plan.code ?? "—"}</span>
              <span className="text-muted-foreground mt-2 text-xs">
                {t("fields.targetAudience")}
              </span>
              <span className="text-sm">
                {plan.audience === "RECRUITER"
                  ? tPlans("targetAudienceOptions.employer")
                  : tPlans("targetAudienceOptions.candidate")}
              </span>
              <p className="text-muted-foreground mt-2 text-xs">{t("fields.immutableHint")}</p>
            </div>

            <div className="flex flex-col gap-2.5 md:col-span-2">
              <Label htmlFor="editPlanName" className="font-semibold">
                {t("fields.planName")}
              </Label>
              <Input
                id="editPlanName"
                required
                value={form.subscriptionName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subscriptionName: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="editPrice" className="font-semibold">
                {t("fields.price")}
              </Label>
              <Input
                id="editPrice"
                type="number"
                required
                min={0}
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="editDurationDays" className="font-semibold">
                {t("fields.durationDays")}
              </Label>
              <Input
                id="editDurationDays"
                type="number"
                required
                min={1}
                value={form.durationDays}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, durationDays: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5 md:col-span-2">
              <Label htmlFor="editDescription" className="font-semibold">
                {t("fields.descriptionLabel")}
              </Label>
              <Textarea
                id="editDescription"
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="editSortOrder" className="font-semibold">
                {t("fields.sortOrder")}
              </Label>
              <Input
                id="editSortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="editHighlightLabel" className="font-semibold">
                {t("fields.highlightLabel")}
              </Label>
              <Input
                id="editHighlightLabel"
                maxLength={60}
                value={form.highlightLabel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, highlightLabel: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id="editIsPublic"
                checked={form.isPublic}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isPublic: checked === true }))
                }
              />
              <Label htmlFor="editIsPublic" className="cursor-pointer text-sm">
                {t("fields.isPublic")}
              </Label>
            </div>

            <div className="bg-muted/30 mt-2 rounded-xl border p-5 md:col-span-2">
              <h3 className="text-foreground mb-4 border-b pb-3 text-lg font-semibold">
                {t("fields.featuresSection")}
              </h3>
              <PlanFeatureEditor audience={plan.audience} value={features} onChange={setFeatures} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? t("buttons.saving") : t("buttons.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
