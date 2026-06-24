import { setRequestLocale } from "next-intl/server";

import { RecruiterCompanyProfilePage } from "@/features/recruiter/components/recruiter-company-profile-page";

type RecruiterCompanyProfilePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterCompanyProfile({
  params,
}: RecruiterCompanyProfilePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterCompanyProfilePage />;
}
