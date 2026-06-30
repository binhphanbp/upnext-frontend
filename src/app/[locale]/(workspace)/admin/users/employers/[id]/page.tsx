import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmployerDetailsPage } from "@/features/admin/components/users/employer-details-page";

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function AdminEmployerDetailsRoute({ params }: PageProps) {
  const resolvedParams = await params;
  setRequestLocale(resolvedParams.locale);

  if (!resolvedParams.id) {
    notFound();
  }

  return <EmployerDetailsPage employerId={resolvedParams.id} />;
}
