import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

type RecruiterTeamPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterTeam({ params }: RecruiterTeamPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  redirect(`/${locale}/recruiter/team/members`);
}
