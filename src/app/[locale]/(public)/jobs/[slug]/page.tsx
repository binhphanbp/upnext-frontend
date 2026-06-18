import { setRequestLocale } from "next-intl/server";

import { JobDetailRoute } from "@/features/marketing/jobs/jobs-route";

type JobDetailPageProps = Readonly<{
  params: Promise<{ locale: string; slug: string }>;
}>;

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return <JobDetailRoute slug={slug} />;
}
