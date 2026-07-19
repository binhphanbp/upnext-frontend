import { setRequestLocale } from "next-intl/server";

import { CandidateEvaluationPage } from "@/features/recruiter/components/candidate-evaluation-page";

type PageProps = Readonly<{
  params: Promise<{
    locale: string;
    applicationId: string;
  }>;
}>;

export default async function RecruiterCandidateEvaluationRoute({ params }: PageProps) {
  const { locale, applicationId } = await params;
  setRequestLocale(locale);

  return <CandidateEvaluationPage applicationId={applicationId} />;
}
