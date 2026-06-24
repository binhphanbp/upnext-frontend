import { setRequestLocale } from "next-intl/server";

import { RecruiterForgotPasswordPage } from "@/features/recruiter/components/login-page";

type RecruiterForgotPasswordRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterForgotPasswordRoute({
  params,
}: RecruiterForgotPasswordRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterForgotPasswordPage />;
}
