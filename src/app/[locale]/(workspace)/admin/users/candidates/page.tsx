import { useTranslations } from "next-intl";

import { CandidatesTable } from "@/features/admin/components/users/candidates-table";

export default function CandidatesPage() {
  const t = useTranslations("Admin.users.candidates");

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <CandidatesTable />
    </div>
  );
}
