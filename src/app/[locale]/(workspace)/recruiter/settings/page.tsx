import { setRequestLocale } from "next-intl/server";

import { RecruiterSettingsPage } from "@/features/recruiter/components/recruiter-settings-page";

type RecruiterSettingsPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterSettings({ params }: RecruiterSettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterSettingsPage />;
}
