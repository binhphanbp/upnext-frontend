import { Suspense } from "react";

import { AddMasterDataDialog } from "@/features/admin/components/system/master-data/add-master-data-dialog";
import { MasterDataTable } from "@/features/admin/components/system/master-data/master-data-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminMasterDataPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dữ liệu gốc</h1>
          <p className="text-muted-foreground">
            Quản lý các danh mục lõi của hệ thống như Ngành nghề, Kỹ năng, Địa điểm, v.v.
          </p>
        </div>
        <AddMasterDataDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <MasterDataTable />
      </Suspense>
    </div>
  );
}
