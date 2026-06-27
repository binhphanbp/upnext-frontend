import { setRequestLocale } from "next-intl/server";

import { CandidateApplicationDetailPage } from "@/features/candidate/applications";

type ApplicationDetailPageProps = Readonly<{
  params: Promise<{ id: string; locale: string }>;
}>;

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  return <CandidateApplicationDetailPage applicationId={id} />;
}
