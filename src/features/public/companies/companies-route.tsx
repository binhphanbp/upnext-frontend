"use client";

import { useRouter } from "@/i18n/navigation";

import { PublicCompanyPage } from "./components";

export function CompaniesRoute() {
  const router = useRouter();

  return <PublicCompanyPage navigate={(path) => router.push(path)} />;
}

export function CompanyDetailRoute() {
  return <CompaniesRoute />;
}
