import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { JobPostDetailsPage } from "@/features/admin/components/content/jobs/job-post-details-page";
import { Skeleton } from "@/shared/ui/skeleton";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminJobPostPage({ params }: PageProps) {
  const t = await getTranslations("Admin.content.jobs.details");
  const { id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <JobPostDetailsPage id={id} />
      </Suspense>
    </div>
  );
}
