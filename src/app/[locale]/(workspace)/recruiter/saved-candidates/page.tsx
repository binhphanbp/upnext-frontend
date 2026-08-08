import { setRequestLocale } from "next-intl/server";

import { RecruiterShortlistPage } from "@/features/recruiter/shortlists/recruiter-shortlist-page";

type RecruiterSavedCandidatesRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterSavedCandidates({
  params,
}: RecruiterSavedCandidatesRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterShortlistPage />;
}
