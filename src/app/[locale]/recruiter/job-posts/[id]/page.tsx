import { setRequestLocale } from "next-intl/server";

import { JobPostDetailPage } from "@/features/recruiter/components/job-post-detail-page";

export const metadata = {
  title: "Chi tiết tin tuyển dụng",
};

type JobPostDetailRouteProps = Readonly<{
  params: Promise<{
    locale: string;
    id: string;
  }>;
}>;

export default async function JobPostDetailRoute({ params }: JobPostDetailRouteProps) {
  const { locale, id } = await params;

  setRequestLocale(locale);

  return <JobPostDetailPage id={id} />;
}
