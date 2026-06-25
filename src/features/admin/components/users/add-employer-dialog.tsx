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

export function AddEmployerDialog() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Admin.users.employers");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          {t("addEmployer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="companyName">{t("dialog.companyName")}</Label>
            <Input id="companyName" placeholder={t("dialog.companyNamePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="representative">{t("table.representative")}</Label>
            <Input id="representative" placeholder="VD: Nguyễn Văn A" />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="email">{t("dialog.email")}</Label>
            <Input id="email" type="email" placeholder={t("dialog.emailPlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="plan">{t("dialog.plan")}</Label>
            <Select defaultValue="Free">
              <SelectTrigger>
                <SelectValue placeholder={t("dialog.planPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Gói Cơ bản (Free)</SelectItem>
                <SelectItem value="Pro">Gói Nâng cao (Pro)</SelectItem>
                <SelectItem value="Premium">Gói Cao cấp (Premium)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("dialog.cancel")}
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t("dialog.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
