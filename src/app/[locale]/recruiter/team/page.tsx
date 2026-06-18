import { setRequestLocale } from "next-intl/server";

import { TeamRolesPage } from "@/features/recruiter/components/team-roles-page";

export const metadata = {
  title: "Thành viên & phân quyền",
};

type RecruiterTeamRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterTeamRoute({ params }: RecruiterTeamRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <TeamRolesPage />;
}
