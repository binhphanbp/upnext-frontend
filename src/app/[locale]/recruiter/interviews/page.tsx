import { setRequestLocale } from "next-intl/server";

import { RecruiterInterviewsPage } from "@/features/recruiter/components/interviews-page";

type RecruiterInterviewsRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterInterviewsRoute({ params }: RecruiterInterviewsRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <RecruiterInterviewsPage />;
}
