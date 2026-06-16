import { setRequestLocale } from "next-intl/server";

import { CandidatesPage } from "@/features/recruiter/components/candidates-page";

export const metadata = {
  title: "Ứng viên",
};

type RecruiterCandidatesRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterCandidatesRoute({ params }: RecruiterCandidatesRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <CandidatesPage />;
}
