import { setRequestLocale } from "next-intl/server";

import { RecruiterJobPostsPage } from "@/features/recruiter/components/job-posts-page";

export const metadata = {
  title: "Tin tuyển dụng",
};

type RecruiterJobPostsRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterJobPostsRoute({ params }: RecruiterJobPostsRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <RecruiterJobPostsPage />;
}
