import { setRequestLocale } from "next-intl/server";

import { CreateJobPostPage } from "@/features/recruiter/components/create-job-post-page";

export const metadata = {
  title: "Chỉnh sửa tin tuyển dụng",
};

type EditJobPostRouteProps = Readonly<{
  params: Promise<{
    locale: string;
    id: string;
  }>;
}>;

export default async function EditJobPostRoute({ params }: EditJobPostRouteProps) {
  const { locale, id } = await params;

  setRequestLocale(locale);

  return <CreateJobPostPage mode="edit" jobId={id} />;
}
