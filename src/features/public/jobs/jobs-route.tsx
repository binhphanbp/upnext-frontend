"use client";

import { useCallback } from "react";

import { useRouter } from "@/i18n/navigation";

import { PublicJobDetailPage, PublicJobsPage } from "./components";

export function JobsRoute() {
  const router = useRouter();
  const navigate = useCallback((path: string) => router.push(path), [router]);
  const replace = useCallback((path: string) => router.replace(path, { scroll: false }), [router]);

  return <PublicJobsPage navigate={navigate} replace={replace} />;
}

export function JobDetailRoute({ slug }: { slug: string }) {
  const router = useRouter();

  return <PublicJobDetailPage path={`/jobs/${slug}`} navigate={(path) => router.push(path)} />;
}
