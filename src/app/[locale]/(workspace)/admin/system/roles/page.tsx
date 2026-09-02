import { Suspense } from "react";

import { AddRoleDialog } from "@/features/admin/components/system/roles/add-role-dialog";
import { RolesTable } from "@/features/admin/components/system/roles/roles-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminRolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddRoleDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <RolesTable />
      </Suspense>
    </div>
  );
}
