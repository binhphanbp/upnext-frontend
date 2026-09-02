import { setRequestLocale } from "next-intl/server";

import { RecruiterCandidateDetailPage } from "@/features/recruiter/talent-pool/recruiter-candidate-detail-page";

type RecruiterCandidateDetailRouteProps = Readonly<{
  params: Promise<{ locale: string; candidateProfileId: string }>;
}>;

export default async function RecruiterCandidateDetailRoute({
  params,
}: RecruiterCandidateDetailRouteProps) {
  const { locale, candidateProfileId } = await params;
  setRequestLocale(locale);

  return <RecruiterCandidateDetailPage candidateProfileId={candidateProfileId} />;
}
