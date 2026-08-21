import { setRequestLocale } from "next-intl/server";

import { AuthPage } from "@/features/auth/auth-page";

type CandidateResetPasswordPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CandidateResetPasswordPage({
  params,
}: CandidateResetPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPage mode="reset-password" />;
}
