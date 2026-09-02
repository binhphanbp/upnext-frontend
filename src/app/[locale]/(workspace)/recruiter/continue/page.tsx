import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

import { RecruiterContinuePage } from "@/features/recruiter/components/recruiter-continue-page";

type RecruiterContinueProps = Readonly<{
  params: Promise<{ locale: string }>;
}>;

export default async function RecruiterContinue({ params }: RecruiterContinueProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Trang đọc `to` và `as` từ query string nên cần Suspense boundary.
  return (
    <Suspense fallback={null}>
      <RecruiterContinuePage />
    </Suspense>
  );
}
