import { setRequestLocale } from "next-intl/server";

import { RecruiterCompanyReputationPage } from "@/features/recruiter/company-reputation/recruiter-company-reputation-page";

type RecruiterCompanyReputationRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterCompanyReputation({
  params,
}: RecruiterCompanyReputationRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterCompanyReputationPage />;
}
