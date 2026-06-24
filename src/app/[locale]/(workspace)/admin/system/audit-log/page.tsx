import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { Suspense } from "react";

import { AuditLogTable } from "@/features/admin/components/system/audit-log/audit-log-table";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminAuditLogPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nhật ký hệ thống</h1>
          <p className="text-muted-foreground">
            Lưu vết mọi thao tác thay đổi dữ liệu của nhân sự nội bộ vì mục đích bảo mật.
          </p>
        </div>
        <Button variant="outline">
          <DownloadSimple className="mr-2" />
          Xuất Log CSV
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AuditLogTable />
      </Suspense>
    </div>
  );
}
