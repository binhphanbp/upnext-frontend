import { setRequestLocale } from "next-intl/server";

import { RecruiterBillingPage } from "@/features/recruiter/components/billing-page";

type BillingPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function BillingPage({ params }: BillingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <RecruiterBillingPage />;
}
