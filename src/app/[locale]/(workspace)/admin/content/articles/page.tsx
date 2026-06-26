import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { ArticlesTable } from "@/features/admin/components/content/articles/articles-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminArticlesPage() {
  const t = useTranslations("Admin.content.articles");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ArticlesTable />
      </Suspense>
    </div>
  );
}
