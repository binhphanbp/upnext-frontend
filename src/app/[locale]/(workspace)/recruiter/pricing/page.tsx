import { setRequestLocale } from "next-intl/server";

import { RecruiterPricingPage } from "@/features/recruiter/components/recruiter-pricing-page";

type PricingPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterPricingRoute({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterPricingPage />;
}
