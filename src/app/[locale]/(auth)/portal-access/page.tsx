import { setRequestLocale } from "next-intl/server";

import { AdminLoginPage } from "@/features/auth/admin-login-page";

type AdminLoginRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function AdminLoginRoute({ params }: AdminLoginRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminLoginPage />;
}
