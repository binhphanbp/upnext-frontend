import { Suspense } from "react";

import { SearchKeywordsTable } from "@/features/admin/components/system/search-keywords/search-keywords-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminSearchKeywordsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Phân tích từ khóa tìm kiếm
        </h1>
        <p className="text-muted-foreground text-sm">
          Xem thống kê các từ khóa được tìm kiếm nhiều nhất bởi ứng viên trên hệ thống.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
        <SearchKeywordsTable />
      </Suspense>
    </div>
  );
}
