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

export function AddMasterDataDialog() {
  const [open, setOpen] = useState(false);
  const tMaster = useTranslations("Admin.system.masterData");
  const t = useTranslations("Admin.system.masterData.dialog");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          {tMaster("addMasterData")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="datasetName">{t("fields.datasetName")}</Label>
            <Input id="datasetName" placeholder={t("fields.datasetNamePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="category">{t("fields.category")}</Label>
            <Select defaultValue="nganh_nghe">
              <SelectTrigger>
                <SelectValue placeholder={t("fields.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nganh_nghe">{t("categoryOptions.industry")}</SelectItem>
                <SelectItem value="ky_nang">{t("categoryOptions.skill")}</SelectItem>
                <SelectItem value="dia_diem">{t("categoryOptions.location")}</SelectItem>
                <SelectItem value="cap_bac">{t("categoryOptions.level")}</SelectItem>
                <SelectItem value="loai_hinh">{t("categoryOptions.type")}</SelectItem>
                <SelectItem value="khac">{t("categoryOptions.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="dataCode">{t("fields.dataCode")}</Label>
            <Input id="dataCode" placeholder={t("fields.dataCodePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="description">{t("fields.description")}</Label>
            <Input id="description" placeholder={t("fields.descriptionPlaceholder")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("buttons.cancel")}
          </Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            {t("buttons.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
