import { Suspense } from "react";

import { JobPostsTable } from "@/features/admin/components/content/jobs/job-posts-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminJobsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý tin đăng</h1>
        <p className="text-muted-foreground">
          Duyệt, chỉnh sửa và quản lý các tin tuyển dụng được đăng tải trên hệ thống.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <JobPostsTable />
      </Suspense>
    </div>
  );
}
