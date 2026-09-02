import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RecruiterDashboardPage } from "@/features/recruiter/components/recruiter-dashboard-page";

type RecruiterPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: RecruiterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Recruiter.dashboard" });

  return {
    title: `${t("title")} | UpNext`,
    description: t("subtitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function RecruiterPage({ params }: RecruiterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterDashboardPage />;
}
