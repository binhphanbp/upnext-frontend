import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { CompaniesRoute } from "@/features/public/companies/companies-route";

type CompaniesPageProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function CompaniesPage({ params }: CompaniesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The listing seeds its filters from the query string, so it needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <CompaniesRoute />
    </Suspense>
  );
}
