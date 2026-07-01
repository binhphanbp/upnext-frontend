import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";

export default async function EditArticlePage() {
  const t = await getTranslations("Admin.content.articles");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa bài viết</h1>
        <p className="text-muted-foreground">Tính năng chỉnh sửa bài viết đang được phát triển.</p>
      </div>

      <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
        <p className="mb-4">Trang chỉnh sửa bài viết đầy đủ sẽ sớm ra mắt.</p>
        <Link href="/admin/content/articles">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    </div>
  );
}
