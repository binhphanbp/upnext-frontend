import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { ModerationTable } from "@/features/admin/components/content/moderation/moderation-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminModerationPage() {
  const t = useTranslations("Admin.content.moderation");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ModerationTable />
      </Suspense>
    </div>
  );
}
