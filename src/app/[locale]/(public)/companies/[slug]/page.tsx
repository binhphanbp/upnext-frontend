import { setRequestLocale } from "next-intl/server";

import { CompanyDetailRoute } from "@/features/marketing/companies/companies-route";

type CompanyDetailPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CompanyDetailRoute />;
}
