import { Suspense } from "react";

import { ModerationTable } from "@/features/admin/components/content/moderation/moderation-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminModerationPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kiểm duyệt nội dung</h1>
        <p className="text-muted-foreground">
          Quản lý các báo cáo vi phạm, tin rác, và đảm bảo môi trường tuyển dụng sạch.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ModerationTable />
      </Suspense>
    </div>
  );
}
