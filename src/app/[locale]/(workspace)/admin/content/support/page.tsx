import { useTranslations } from "next-intl";

import { AdminSupportQueue } from "@/features/chat/components/admin-support-queue";

export default function AdminSupportPage() {
  const t = useTranslations("Admin.content.support");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AdminSupportQueue />
    </div>
  );
}
