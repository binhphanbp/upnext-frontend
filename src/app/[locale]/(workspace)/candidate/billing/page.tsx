import { setRequestLocale } from "next-intl/server";

import { CandidateBillingPage } from "@/features/candidate/components/candidate-billing-page";

type CandidateBillingPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function BillingRoutePage({ params }: CandidateBillingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CandidateBillingPage />;
}
