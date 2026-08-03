import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AddMasterDataDialog } from "@/features/admin/components/system/master-data/add-master-data-dialog";
import { MasterDataTable } from "@/features/admin/components/system/master-data/master-data-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminMasterDataPage() {
  const t = useTranslations("Admin.system.masterData");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddMasterDataDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <MasterDataTable />
      </Suspense>
    </div>
  );
}
