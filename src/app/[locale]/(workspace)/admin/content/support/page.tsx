import { Suspense } from "react";

import { SupportTable } from "@/features/admin/components/content/support/support-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminSupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trung tâm hỗ trợ</h1>
        <p className="text-muted-foreground">
          Tiếp nhận và xử lý các yêu cầu hỗ trợ từ Ứng viên và Nhà tuyển dụng.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SupportTable />
      </Suspense>
    </div>
  );
}
