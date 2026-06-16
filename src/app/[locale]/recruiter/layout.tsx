import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { DashboardShell } from "@/features/recruiter/components/dashboard-shell";

type RecruiterLayoutProps = Readonly<{
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterLayout({ children, params }: RecruiterLayoutProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <DashboardShell>{children}</DashboardShell>;
}
