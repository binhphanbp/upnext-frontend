import { setRequestLocale } from "next-intl/server";

import { RecruiterInterviewsPage } from "@/features/recruiter/components/interviews/recruiter-interviews-page";

type InterviewsPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function InterviewsPage({ params }: InterviewsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterInterviewsPage />;
}
