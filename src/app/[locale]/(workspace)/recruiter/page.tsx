import { setRequestLocale } from "next-intl/server";

import { RecruiterDashboardPage } from "@/features/recruiter/components/recruiter-dashboard-page";

type RecruiterPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterPage({ params }: RecruiterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterDashboardPage />;
}
