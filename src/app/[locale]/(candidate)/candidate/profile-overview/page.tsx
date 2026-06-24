import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CandidateProfileOverviewRoute } from "@/features/candidate/profile-overview/profile-overview-route";

type CandidateProfileOverviewPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CandidateProfileOverviewPage({
  params,
}: CandidateProfileOverviewPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <CandidateProfileOverviewRoute />
    </Suspense>
  );
}
