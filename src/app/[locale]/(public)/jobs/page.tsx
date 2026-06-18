import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { JobsRoute } from "@/features/marketing/jobs/jobs-route";

type JobsPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function JobsPage({ params }: JobsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <JobsRoute />
    </Suspense>
  );
}
