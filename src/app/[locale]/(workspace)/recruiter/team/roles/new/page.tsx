import { setRequestLocale } from "next-intl/server";

import { RecruiterRoleFormPage } from "@/features/recruiter/components/recruiter-role-form-page";

type NewRecruiterRolePageProps = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}>;

export default async function NewRecruiterRolePage({
  params,
  searchParams,
}: NewRecruiterRolePageProps) {
  const { locale } = await params;
  const { returnTo } = await searchParams;
  setRequestLocale(locale);

  return (
    <RecruiterRoleFormPage
      mode="create"
      {...(returnTo === "members" ? { returnTo: "members" as const } : {})}
    />
  );
}
