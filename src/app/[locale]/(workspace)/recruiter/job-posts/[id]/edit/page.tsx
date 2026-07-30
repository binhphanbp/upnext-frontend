import { setRequestLocale } from "next-intl/server";

import { RecruiterJobPostsPage } from "@/features/recruiter/job-posts/job-posts-page";

type EditRecruiterJobPostRouteProps = Readonly<{
  params: Promise<{ locale: string; id: string }>;
}>;

export default async function EditRecruiterJobPostRoute({
  params,
}: EditRecruiterJobPostRouteProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <RecruiterJobPostsPage editJobId={id} />;
}
