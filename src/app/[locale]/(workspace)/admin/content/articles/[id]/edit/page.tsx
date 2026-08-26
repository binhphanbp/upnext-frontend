import { ArticleForm } from "@/features/admin/components/content/articles/article-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEditArticlePage({ params }: PageProps) {
  const { id } = await params;
  return <ArticleForm mode="edit" postId={id} />;
}
