import { setRequestLocale } from "next-intl/server";

import { RecruiterRegisterPage } from "@/features/recruiter/components/login-page";

type RecruiterRegisterRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterRegisterRoute({ params }: RecruiterRegisterRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterRegisterPage />;
}
