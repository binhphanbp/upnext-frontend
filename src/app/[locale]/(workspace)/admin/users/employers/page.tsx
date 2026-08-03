import { useTranslations } from "next-intl";

import { EmployersTable } from "@/features/admin/components/users/employers-table";

export default function EmployersPage() {
  const t = useTranslations("Admin.users.employers");

  return (
    <div className="flex-1 space-y-6">
      <EmployersTable />
    </div>
  );
}
