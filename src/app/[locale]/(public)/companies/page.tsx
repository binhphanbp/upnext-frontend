import { setRequestLocale } from "next-intl/server";

import { CompaniesRoute } from "@/features/marketing/companies/companies-route";

type CompaniesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CompaniesPage({ params }: CompaniesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CompaniesRoute />;
}
