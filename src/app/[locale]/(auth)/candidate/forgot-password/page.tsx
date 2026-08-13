import { setRequestLocale } from "next-intl/server";

import { AuthPage } from "@/features/auth/auth-page";

type CandidateForgotPasswordPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CandidateForgotPasswordPage({
  params,
}: CandidateForgotPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPage mode="forgot-password" />;
}
