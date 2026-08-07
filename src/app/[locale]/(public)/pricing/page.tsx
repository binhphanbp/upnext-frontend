import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { PricingPage } from "@/features/public/pricing/pricing-page";

type PricingRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export async function generateMetadata({ params }: PricingRouteProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pricing.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PricingRoute({ params }: PricingRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <PricingPage />
    </Suspense>
  );
}
