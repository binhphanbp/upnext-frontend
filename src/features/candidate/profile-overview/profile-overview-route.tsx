"use client";

import { useRouter } from "@/i18n/navigation";

import { CandidateProfileOverviewPage } from "./profile-overview-page";

function mapDraftPath(path: string) {
  if (path === "/homepage-v2") return "/";
  if (path.startsWith("/jobs-v2")) return path.replace("/jobs-v2", "/jobs");
  if (path.startsWith("/companies-v2")) return path.replace("/companies-v2", "/companies");
  if (path.startsWith("/profile-v2")) {
    const query = path.includes("?") ? path.slice(path.indexOf("?")) : "";
    return `/candidate/profile-overview${query}`;
  }
  return path;
}

export function CandidateProfileOverviewRoute() {
  const router = useRouter();

  return <CandidateProfileOverviewPage navigate={(path) => router.push(mapDraftPath(path))} />;
}
