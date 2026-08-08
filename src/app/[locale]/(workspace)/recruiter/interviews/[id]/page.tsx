import { setRequestLocale } from "next-intl/server";

import { InterviewDetailPage } from "@/features/recruiter/components/interviews/interview-detail-page";

type PageProps = Readonly<{
  params: Promise<{
    locale: string;
    id: string;
  }>;
}>;

export default async function RecruiterInterviewDetailRoute({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <InterviewDetailPage interviewId={id} />;
}
