import { setRequestLocale } from "next-intl/server";

import { RecruiterCandidatesPage } from "@/features/recruiter/components/recruiter-candidates-page";

type RecruiterCandidatesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterCandidates({ params }: RecruiterCandidatesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterCandidatesPage />;
}
