import { DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { AuditLogTable } from "@/features/admin/components/system/audit-log/audit-log-table";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

export default function AdminAuditLogPage() {
  const t = useTranslations("Admin.system.auditLog");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button variant="outline">
          <DownloadSimple className="mr-2" />
          {t("exportLog")}
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <AuditLogTable />
      </Suspense>
    </div>
  );
}
