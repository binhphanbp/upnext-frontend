import { setRequestLocale } from "next-intl/server";

import { RecruiterAnalyticsPage } from "@/features/recruiter/components/recruiter-analytics-page";

type AnalyticsPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterAnalyticsPage />;
}
