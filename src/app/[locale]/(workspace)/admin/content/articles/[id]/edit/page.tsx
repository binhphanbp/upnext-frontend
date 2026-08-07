import { getTranslations } from "next-intl/server";

import { ArticleForm } from "@/features/admin/components/content/articles/article-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditArticlePage({ params }: PageProps) {
  const t = await getTranslations("Admin.content.articles.form");
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("editTitle")}</h1>
        <p className="text-muted-foreground">{t("editSubtitle")}</p>
      </div>
      <ArticleForm mode="edit" postId={id} />
    </div>
  );
}
