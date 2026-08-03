import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AppealsTable } from "@/features/admin/components/appeals/appeals-table";
import { ModerationTable } from "@/features/admin/components/content/moderation/moderation-table";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export default function AdminReportsPage() {
  const t = useTranslations("Admin.content.moderation");

  return (
    <div className="flex-1 space-y-6">
      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="reports">Báo cáo vi phạm</TabsTrigger>
          <TabsTrigger value="appeals">Kháng cáo</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-0 outline-none">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ModerationTable />
          </Suspense>
        </TabsContent>

        <TabsContent value="appeals" className="mt-0 outline-none">
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <AppealsTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
