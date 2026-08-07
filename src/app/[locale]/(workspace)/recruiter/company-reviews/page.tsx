import { setRequestLocale } from "next-intl/server";

import { RecruiterCompanyReviewsPage } from "@/features/recruiter/company-reviews/recruiter-company-reviews-page";

type RecruiterCompanyReviewsRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterCompanyReviews({
  params,
}: RecruiterCompanyReviewsRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterCompanyReviewsPage />;
}
