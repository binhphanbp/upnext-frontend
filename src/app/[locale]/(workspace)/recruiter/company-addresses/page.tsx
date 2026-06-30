import { setRequestLocale } from "next-intl/server";

import { RecruiterCompanyAddressesPage } from "@/features/recruiter/components/recruiter-company-addresses-page";

type RecruiterCompanyAddressesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterCompanyAddresses({
  params,
}: RecruiterCompanyAddressesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterCompanyAddressesPage />;
}
