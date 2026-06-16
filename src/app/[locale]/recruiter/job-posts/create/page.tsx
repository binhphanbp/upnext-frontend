import { setRequestLocale } from "next-intl/server";

import { CreateJobPostPage } from "@/features/recruiter/components/create-job-post-page";

export const metadata = {
  title: "Đăng tin tuyển dụng mới",
};

type CreateRecruiterJobPostRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function CreateRecruiterJobPostRoute({
  params,
}: CreateRecruiterJobPostRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <CreateJobPostPage />;
}
