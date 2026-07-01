import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ArticleDetailsPage } from "@/features/admin/components/content/articles/article-details-page";
import { Skeleton } from "@/shared/ui/skeleton";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminArticlePage({ params }: PageProps) {
  const t = await getTranslations("Admin.content.articles.details");
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ArticleDetailsPage id={id} />
      </Suspense>
    </div>
  );
}
