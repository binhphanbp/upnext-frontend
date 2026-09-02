import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { RecruiterTalentPoolPage } from "@/features/recruiter/talent-pool/recruiter-talent-pool-page";

type RecruiterTalentPoolRouteProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterTalentPool({ params }: RecruiterTalentPoolRouteProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <RecruiterTalentPoolPage />
    </Suspense>
  );
}
