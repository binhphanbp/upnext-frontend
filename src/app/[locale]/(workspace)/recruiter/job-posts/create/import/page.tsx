import { setRequestLocale } from "next-intl/server";

import { JobPostAiImportPage } from "@/features/recruiter/job-posts/job-post-ai-import-page";

type CreateImportJobPostRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CreateImportJobPostRoute({ params }: CreateImportJobPostRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <JobPostAiImportPage />;
}
