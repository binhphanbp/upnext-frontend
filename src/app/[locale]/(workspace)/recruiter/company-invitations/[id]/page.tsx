import { setRequestLocale } from "next-intl/server";

import { RecruiterCompanyInvitationPage } from "@/features/recruiter/components/company-invitation-page";

type RecruiterCompanyInvitationRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterCompanyInvitationRoute({
  params,
}: RecruiterCompanyInvitationRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterCompanyInvitationPage />;
}
