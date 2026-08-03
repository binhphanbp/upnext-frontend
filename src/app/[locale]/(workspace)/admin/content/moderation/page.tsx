import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { ModerationTable } from "@/features/admin/components/content/moderation/moderation-table";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminModerationPage() {
  const t = useTranslations("Admin.content.moderation");

  return (
    <div className="flex-1 space-y-6">
      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ModerationTable />
      </Suspense>
    </div>
  );
}
