import { getTranslations } from "next-intl/server";

import { ArticleForm } from "@/features/admin/components/content/articles/article-form";

export default async function AdminCreateArticlePage() {
  const t = await getTranslations("Admin.content.articles.form");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("createTitle")}</h1>
        <p className="text-muted-foreground">{t("createSubtitle")}</p>
      </div>
      <ArticleForm mode="create" />
    </div>
  );
}
