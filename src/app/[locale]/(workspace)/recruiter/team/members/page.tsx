import { setRequestLocale } from "next-intl/server";

import { RecruiterMembersPage } from "@/features/recruiter/components/recruiter-members-page";

type RecruiterMembersPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterMembers({ params }: RecruiterMembersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterMembersPage />;
}
