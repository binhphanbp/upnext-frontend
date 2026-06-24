import { setRequestLocale } from "next-intl/server";

import { RecruiterJobPostsPage } from "@/features/recruiter/job-posts/job-posts-page";

type RecruiterJobPostsRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterJobPostsRoute({ params }: RecruiterJobPostsRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterJobPostsPage />;
}
