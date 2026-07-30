import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import * as React from "react";

import { CandidateDetailsPage } from "@/features/admin/components/users/candidate-details-page";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function AdminCandidateDetailsRoute({ params }: PageProps) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);

  if (!resolvedParams.id) {
    notFound();
  }

  return <CandidateDetailsPage candidateId={resolvedParams.id} />;
}
