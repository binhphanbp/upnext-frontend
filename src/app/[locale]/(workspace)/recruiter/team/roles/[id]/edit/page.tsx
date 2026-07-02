import { setRequestLocale } from "next-intl/server";

import { RecruiterRoleFormPage } from "@/features/recruiter/components/recruiter-role-form-page";

type EditRecruiterRolePageProps = Readonly<{
  params: Promise<{ id: string; locale: string }>;
}>;

export default async function EditRecruiterRolePage({ params }: EditRecruiterRolePageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  return <RecruiterRoleFormPage mode="edit" roleId={id} />;
}
