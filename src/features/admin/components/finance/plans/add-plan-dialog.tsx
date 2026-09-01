"use client";

import { Plus } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import Swal from "sweetalert2";

import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import {
  createSubscriptionPlan,
  setPlanFeatures,
  type PlanAudience,
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
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

import {
  emptyFeatureFormState,
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

/** `code` must look like a constant, since every tier-based rule references it. */
const PLAN_CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,59}$/;

type FormState = {
  subscriptionName: string;
  code: string;
  audience: PlanAudience;
  price: string;
  durationDays: string;
  description: string;
  isPublic: boolean;
  sortOrder: string;
  highlightLabel: string;
};

function initialFormState(): FormState {
  return {
    subscriptionName: "",
    code: "",
    audience: "RECRUITER",
    price: "",
    durationDays: "30",
    description: "",
    isPublic: true,
    sortOrder: "0",
    highlightLabel: "",
  };
}

export function AddPlanDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState());
  const [features, setFeatures] = useState<PlanFeatureFormState>(emptyFeatureFormState());
  const [codeError, setCodeError] = useState<string | null>(null);

  const t = useTranslations("Admin.finance.plans.dialog");
  const tPlans = useTranslations("Admin.finance.plans");
  const queryClient = useQueryClient();
  const router = useRouter();

  const resetForm = () => {
    setForm(initialFormState());
    setFeatures(emptyFeatureFormState());
    setCodeError(null);
  };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");

      const plan = await createSubscriptionPlan(
        {
          subscriptionName: form.subscriptionName.trim(),
          code: form.code.trim() || undefined,
          audience: form.audience,
          price: Number(form.price),
          durationDays: Number(form.durationDays),
          description: form.description.trim() || undefined,
          isPublic: form.isPublic,
          sortOrder: Number(form.sortOrder) || 0,
          highlightLabel: form.highlightLabel.trim() || undefined,
        },
        session.accessToken,
      );

      const featurePayload = toSetFeaturesPayload(features, form.audience);
      if (featurePayload.length > 0) {
        await setPlanFeatures(plan.id, featurePayload, session.accessToken);
      }

      return plan;
    },
    onSuccess: () => {
      void toast.fire({ icon: "success", title: t("toasts.createSuccess") });
      queryClient.invalidateQueries({ queryKey: ["adminSubscriptionPlans"] });
      resetForm();
      setOpen(false);
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === "No session") {
        router.replace("/admin/login");
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        clearAdminSession();
        router.replace("/admin/login");
        return;
      }
      // Backend error codes (PLAN_NAME_TAKEN, PLAN_CODE_TAKEN, validation
      // messages) already come back as readable Vietnamese text -- surface them
      // as-is rather than a generic "something went wrong".
      const message = error instanceof ApiError ? error.message : t("toasts.createError");
      void toast.fire({ icon: "error", title: message });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCodeError(null);

    if (form.code.trim() && !PLAN_CODE_PATTERN.test(form.code.trim())) {
      setCodeError(t("fields.codeInvalid"));
      return;
    }
    submit();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          {tPlans("addPlan")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
            <div className="flex flex-col gap-2.5 md:col-span-2">
              <Label htmlFor="planName" className="font-semibold">
                {t("fields.planName")}
              </Label>
              <Input
                id="planName"
                required
                placeholder={t("fields.planNamePlaceholder")}
                value={form.subscriptionName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subscriptionName: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="targetAudience" className="font-semibold">
                {t("fields.targetAudience")}
              </Label>
              <Select
                value={form.audience}
                onValueChange={(value: PlanAudience) =>
                  setForm((prev) => ({ ...prev, audience: value }))
                }
              >
                <SelectTrigger id="targetAudience">
                  <SelectValue placeholder={t("fields.targetAudiencePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECRUITER">
                    {tPlans("table.targetAudienceOptions.employer")}
                  </SelectItem>
                  <SelectItem value="CANDIDATE">
                    {tPlans("table.targetAudienceOptions.candidate")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="planCode" className="font-semibold">
                {t("fields.code")}
              </Label>
              <Input
                id="planCode"
                placeholder={t("fields.codePlaceholder")}
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
              />
              {codeError ? <p className="text-destructive text-xs">{codeError}</p> : null}
              <p className="text-muted-foreground text-xs">{t("fields.codeHint")}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="price" className="font-semibold">
                {t("fields.price")}
              </Label>
              <Input
                id="price"
                type="number"
                required
                min={0}
                placeholder={t("fields.pricePlaceholder")}
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="durationDays" className="font-semibold">
                {t("fields.durationDays")}
              </Label>
              <Input
                id="durationDays"
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
              <Label htmlFor="description" className="font-semibold">
                {t("fields.descriptionLabel")}
              </Label>
              <Textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="sortOrder" className="font-semibold">
                {t("fields.sortOrder")}
              </Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="highlightLabel" className="font-semibold">
                {t("fields.highlightLabel")}
              </Label>
              <Input
                id="highlightLabel"
                placeholder={t("fields.highlightLabelPlaceholder")}
                maxLength={60}
                value={form.highlightLabel}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, highlightLabel: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id="isPublic"
                checked={form.isPublic}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isPublic: checked === true }))
                }
              />
              <Label htmlFor="isPublic" className="cursor-pointer text-sm">
                {t("fields.isPublic")}
              </Label>
            </div>

            <div className="bg-muted/30 mt-2 rounded-xl border p-5 md:col-span-2">
              <h3 className="text-foreground mb-4 border-b pb-3 text-lg font-semibold">
                {t("fields.featuresSection")}
              </h3>
              <PlanFeatureEditor audience={form.audience} value={features} onChange={setFeatures} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              {t("buttons.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? t("buttons.saving") : t("buttons.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
