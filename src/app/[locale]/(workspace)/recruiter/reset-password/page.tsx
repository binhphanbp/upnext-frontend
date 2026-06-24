import { setRequestLocale } from "next-intl/server";

import { RecruiterResetPasswordPage } from "@/features/recruiter/components/login-page";

type RecruiterResetPasswordRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterResetPasswordRoute({
  params,
}: RecruiterResetPasswordRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterResetPasswordPage />;
}
