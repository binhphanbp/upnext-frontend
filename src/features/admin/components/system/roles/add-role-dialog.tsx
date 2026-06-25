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

export function AddRoleDialog() {
  const [open, setOpen] = useState(false);
  const tRole = useTranslations("Admin.system.roles");
  const t = useTranslations("Admin.system.roles.dialog");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2" weight="bold" />
          {tRole("addRole")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="roleName">{t("fields.roleName")}</Label>
            <Input id="roleName" placeholder={t("fields.roleNamePlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="description">{t("fields.description")}</Label>
            <Input id="description" placeholder={t("fields.descriptionPlaceholder")} />
          </div>
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="cloneFrom">{t("fields.cloneFrom")}</Label>
            <Select defaultValue="none">
              <SelectTrigger>
                <SelectValue placeholder={t("fields.cloneFromPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("cloneOptions.none")}</SelectItem>
                <SelectItem value="moderator">{t("cloneOptions.moderator")}</SelectItem>
                <SelectItem value="sales">{t("cloneOptions.sales")}</SelectItem>
                <SelectItem value="support">{t("cloneOptions.support")}</SelectItem>
              </SelectContent>
            </Select>
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
