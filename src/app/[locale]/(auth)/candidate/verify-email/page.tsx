import { setRequestLocale } from "next-intl/server";

import { AuthPage } from "@/features/auth/auth-page";

type CandidateVerifyEmailPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CandidateVerifyEmailPage({ params }: CandidateVerifyEmailPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPage mode="verify-email" />;
}
