"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminAppeals } from "@/features/admin/api/appeals";
import { AppealsTable } from "@/features/admin/components/appeals/appeals-table";
import { ModerationTable } from "@/features/admin/components/content/moderation/moderation-table";
import { getAdminSession } from "@/features/admin/session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

export function AdminReportsTabs() {
  // Appeals block a company from operating, so surface the pending count on the tab
  // itself — otherwise an admin has to open the tab to discover there is work waiting.
  // This shares the cache key AppealsTable uses for its default PENDING view.
  const { data: pendingAppeals } = useQuery({
    queryKey: ["adminAppeals", "PENDING"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminAppeals(session.accessToken, "PENDING");
    },
    refetchOnWindowFocus: true,
  });

  const pendingCount = pendingAppeals?.length ?? 0;

  return (
    <Tabs defaultValue="reports" className="w-full">
      <TabsList className="mb-6 grid w-full max-w-[400px] grid-cols-2">
        <TabsTrigger value="reports">Báo cáo vi phạm</TabsTrigger>
        <TabsTrigger value="appeals" className="gap-2">
          Kháng cáo
          {pendingCount > 0 ? (
            <span
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white"
              aria-label={`${pendingCount} kháng cáo đang chờ xử lý`}
            >
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="mt-0 outline-none">
        <ModerationTable />
      </TabsContent>

      <TabsContent value="appeals" className="mt-0 outline-none">
        <AppealsTable />
      </TabsContent>
    </Tabs>
  );
}
