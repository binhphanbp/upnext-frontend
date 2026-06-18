import { setRequestLocale } from "next-intl/server";

import { AuthPage } from "@/features/auth/auth-page";

type RegisterPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPage mode="register" />;
}
