import { setRequestLocale } from "next-intl/server";

import { RecruiterRolesPage } from "@/features/recruiter/components/recruiter-roles-page";

type RecruiterRolesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterRoles({ params }: RecruiterRolesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterRolesPage />;
}
