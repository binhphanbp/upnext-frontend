import { getTranslations } from "next-intl/server";

import { RecruitersTable } from "@/features/admin/components/users/recruiters-table";

export default async function RecruitersPage() {
  const t = await getTranslations("Admin.users.recruiters");

  return (
    <div className="flex-1 space-y-6">
      <RecruitersTable />
    </div>
  );
}
