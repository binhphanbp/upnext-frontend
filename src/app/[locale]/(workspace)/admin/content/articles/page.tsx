import { Suspense } from "react";

import { ArticlesTable } from "@/features/admin/components/content/articles/articles-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminArticlesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý bài viết</h1>
        <p className="text-muted-foreground">
          Quản lý blog, bài viết kỹ năng, thị trường và thông tin PR trên nền tảng.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ArticlesTable />
      </Suspense>
    </div>
  );
}
