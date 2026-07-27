import { setRequestLocale } from "next-intl/server";

import { CompanyDetailRoute } from "@/features/public/companies/companies-route";

type CompanyDetailPageProps = Readonly<{
  params: Promise<{ locale: string; slug: string }>;
}>;

export default async function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <CompanyDetailRoute slug={slug} />;
}
