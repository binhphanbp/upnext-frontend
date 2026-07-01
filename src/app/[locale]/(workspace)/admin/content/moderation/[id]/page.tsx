import { Suspense } from "react";

import { ReportDetailsPage } from "@/features/admin/components/content/moderation/report-details-page";
import { Skeleton } from "@/shared/ui/skeleton";

export default async function AdminReportDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      }
    >
      <ReportDetailsPage id={id} />
    </Suspense>
  );
}
