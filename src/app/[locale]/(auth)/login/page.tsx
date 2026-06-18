import { setRequestLocale } from "next-intl/server";

import { AuthPage } from "@/features/auth/auth-page";

type LoginPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPage mode="login" />;
}
