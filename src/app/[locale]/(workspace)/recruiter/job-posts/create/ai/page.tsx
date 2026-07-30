import { setRequestLocale } from "next-intl/server";

import { JobPostAiGeneratorPage } from "@/features/recruiter/job-posts/job-post-ai-generator-page";

type CreateAiJobPostRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CreateAiJobPostRoute({ params }: CreateAiJobPostRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <JobPostAiGeneratorPage />;
}
