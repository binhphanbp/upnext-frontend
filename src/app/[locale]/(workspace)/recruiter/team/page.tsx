import { setRequestLocale } from "next-intl/server";

import { RecruiterTeamPage } from "@/features/recruiter/components/recruiter-team-page";

type RecruiterTeamPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterTeam({ params }: RecruiterTeamPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterTeamPage />;
}
