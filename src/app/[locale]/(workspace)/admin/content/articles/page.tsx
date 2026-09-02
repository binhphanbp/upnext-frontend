import { Suspense } from "react";

import { ArticlesManagementPage } from "@/features/admin/components/content/articles/articles-management-page";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminArticlesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-2xl" />}>
      <ArticlesManagementPage />
    </Suspense>
  );
}
