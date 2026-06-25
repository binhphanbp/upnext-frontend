"use client";

import { Plus } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/shared/ui/button";
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

export function AddPlanDialog() {
  const [open, setOpen] = useState(false);
  const tPlans = useTranslations("Admin.finance.plans");
  const t = useTranslations("Admin.finance.plans.dialog");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          {tPlans("addPlan")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="planName">{t("fields.planName")}</Label>
            <Input id="planName" placeholder={t("fields.planNamePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="targetAudience">{t("fields.targetAudience")}</Label>
            <Select defaultValue="employer">
              <SelectTrigger>
                <SelectValue placeholder={t("fields.targetAudiencePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employer">
                  {tPlans("table.targetAudienceOptions.employer")}
                </SelectItem>
                <SelectItem value="candidate">
                  {tPlans("table.targetAudienceOptions.candidate")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="price">{t("fields.price")}</Label>
            <Input id="price" type="number" placeholder={t("fields.pricePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="billingCycle">{t("fields.billingCycle")}</Label>
            <Select defaultValue="month">
              <SelectTrigger>
                <SelectValue placeholder={t("fields.billingCyclePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t("billingCycleOptions.monthly")}</SelectItem>
                <SelectItem value="year">{t("billingCycleOptions.yearly")}</SelectItem>
                <SelectItem value="one-time">{t("billingCycleOptions.oneTime")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("buttons.cancel")}
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t("buttons.createDraft")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
