import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { ModerationTable } from "@/features/admin/components/content/moderation/moderation-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminModerationPage() {
  const t = useTranslations("Admin.content.moderation");

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ModerationTable />
      </Suspense>
    </div>
  );
}
