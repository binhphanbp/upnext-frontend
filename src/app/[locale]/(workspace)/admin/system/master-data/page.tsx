import { Suspense } from "react";

import { TaxonomyManagementPage } from "@/features/admin/components/system/taxonomy/taxonomy-management-page";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminMasterDataPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
      <TaxonomyManagementPage />
    </Suspense>
  );
}
