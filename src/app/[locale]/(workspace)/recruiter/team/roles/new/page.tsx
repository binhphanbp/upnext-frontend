import { setRequestLocale } from "next-intl/server";

import { RecruiterRoleFormPage } from "@/features/recruiter/components/recruiter-role-form-page";

type NewRecruiterRolePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function NewRecruiterRolePage({ params }: NewRecruiterRolePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterRoleFormPage mode="create" />;
}
