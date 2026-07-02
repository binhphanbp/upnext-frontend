import { getTranslations } from "next-intl/server";

import { RecruitersTable } from "@/features/admin/components/users/recruiters-table";

export default async function RecruitersPage() {
  const t = await getTranslations("Admin.users.recruiters");

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <RecruitersTable />
    </div>
  );
}
