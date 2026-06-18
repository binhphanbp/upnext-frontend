import { setRequestLocale } from "next-intl/server";

import { RecruiterDashboardPage } from "@/features/recruiter/components/recruiter-dashboard-page";

export const metadata = {
  title: "Dashboard nhà tuyển dụng",
};

type RecruiterDashboardPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterDashboardRoute({ params }: RecruiterDashboardPageProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <RecruiterDashboardPage />;
}
