import { setRequestLocale } from "next-intl/server";

import { RecruiterResourcesPage } from "@/features/recruiter/components/resources-page";

export const metadata = {
  title: "Gói & tài nguyên",
};

type RecruiterResourcesRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterResourcesRoute({ params }: RecruiterResourcesRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <RecruiterResourcesPage />;
}
