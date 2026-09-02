import { Suspense } from "react";

import { JobPostsTable } from "@/features/admin/components/content/jobs/job-posts-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminJobsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <JobPostsTable />
      </Suspense>
    </div>
  );
}
