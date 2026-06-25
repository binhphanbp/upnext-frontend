import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AddRoleDialog } from "@/features/admin/components/system/roles/add-role-dialog";
import { RolesTable } from "@/features/admin/components/system/roles/roles-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminRolesPage() {
  const t = useTranslations("Admin.system.roles");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddRoleDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <RolesTable />
      </Suspense>
    </div>
  );
}
