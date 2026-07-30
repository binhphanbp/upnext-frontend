"use client";

import { useCallback } from "react";

import { useRouter } from "@/i18n/navigation";

import { PublicCompaniesListPage, PublicCompanyPage } from "./components";

export function CompaniesRoute({ slug }: { slug?: string }) {
  const router = useRouter();
  const navigate = useCallback((path: string) => router.push(path), [router]);

  if (!slug) {
    return <PublicCompaniesListPage navigate={navigate} />;
  }

  return <PublicCompanyPage slug={slug} navigate={navigate} />;
}

export function CompanyDetailRoute({ slug }: { slug: string }) {
  return <CompaniesRoute slug={slug} />;
}
