import { setRequestLocale } from "next-intl/server";

import { RecruiterLoginPage } from "@/features/recruiter/components/login-page";

type RecruiterLoginRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterLoginRoute({ params }: RecruiterLoginRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterLoginPage />;
}
