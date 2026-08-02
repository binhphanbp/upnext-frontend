import { Suspense } from "react";

import { SearchKeywordsTable } from "@/features/admin/components/system/search-keywords/search-keywords-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminSearchKeywordsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <SearchKeywordsTable />
      </Suspense>
    </div>
  );
}
