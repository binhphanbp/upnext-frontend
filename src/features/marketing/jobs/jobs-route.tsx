"use client";

import { useRouter } from "@/i18n/navigation";

import { PublicJobDetailPage, PublicJobsPage } from "./components";

export function JobsRoute() {
  const router = useRouter();

  return <PublicJobsPage navigate={(path) => router.push(path)} />;
}

export function JobDetailRoute({ slug }: { slug: string }) {
  const router = useRouter();

  return <PublicJobDetailPage path={`/jobs/${slug}`} navigate={(path) => router.push(path)} />;
}
