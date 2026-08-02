import { useTranslations } from "next-intl";

import { CandidatesTable } from "@/features/admin/components/users/candidates-table";

export default function CandidatesPage() {
  const t = useTranslations("Admin.users.candidates");

  return (
    <div className="flex-1 space-y-6">
      <CandidatesTable />
    </div>
  );
}
