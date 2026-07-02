import { setRequestLocale } from "next-intl/server";

import { RecruiterPipelinePage } from "@/features/recruiter/components/pipeline/recruiter-pipeline-page";

type PipelinePageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterPipelinePage />;
}
