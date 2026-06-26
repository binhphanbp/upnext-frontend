import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { SupportTable } from "@/features/admin/components/content/support/support-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminSupportPage() {
  const t = useTranslations("Admin.content.support");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SupportTable />
      </Suspense>
    </div>
  );
}
