import { setRequestLocale } from "next-intl/server";

import { RecruiterJobPostsPage } from "@/features/recruiter/job-posts/job-posts-page";

type CreateRecruiterJobPostRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CreateRecruiterJobPostRoute({
  params,
}: CreateRecruiterJobPostRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterJobPostsPage initialView="create" />;
}
