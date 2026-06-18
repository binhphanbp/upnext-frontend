import { setRequestLocale } from "next-intl/server";

import { CompanyProfilePage } from "@/features/recruiter/components/company-profile-page";

export const metadata = {
  title: "Hồ sơ & uy tín",
};

type RecruiterCompanyProfileRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterCompanyProfileRoute({
  params,
}: RecruiterCompanyProfileRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <CompanyProfilePage />;
}
