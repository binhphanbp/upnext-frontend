"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  getMyCandidateApplications,
  getMyFollowedCompanies,
  getMySavedJobs,
  type CandidateApplicationApi,
  type CompanyFollowApi,
  type SavedJobApi,
} from "@/features/candidate/api/profile";
import { useCandidateProfileWorkspace } from "@/features/candidate/profile/use-candidate-profile";

import { hasSufficientCandidateSignals, type HomeCandidateContext } from "./home-personalization";

export type HomeCandidateState =
  | "resolving"
  | "guest"
  | "profile-incomplete"
  | "ready"
  | "not-looking"
  | "unavailable";

const emptyApplications: CandidateApplicationApi[] = [];
const emptySavedJobs: SavedJobApi[] = [];
const emptyCompanyFollows: CompanyFollowApi[] = [];

export function useHomeCandidateContext() {
  const { cvsQuery, isSessionResolved, profileQuery, session } = useCandidateProfileWorkspace();
  const accountId = session?.user.id;

  const applicationsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMyCandidateApplications(session!.accessToken),
    queryKey: ["candidate-applications", accountId],
  });
  const savedJobsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMySavedJobs(session!.accessToken),
    queryKey: ["candidate-saved-jobs", accountId],
  });
  const followedCompaniesQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => getMyFollowedCompanies(session!.accessToken),
    queryKey: ["candidate-company-follows", accountId],
  });

  const candidateContext = useMemo<HomeCandidateContext>(
    () => ({
      profile: profileQuery.data ?? null,
      savedJobIds: new Set(
        (savedJobsQuery.data ?? emptySavedJobs).map((savedJob) => savedJob.jobPostId),
      ),
      followedCompanyIds: new Set(
        (followedCompaniesQuery.data ?? emptyCompanyFollows).map((follow) => follow.companyId),
      ),
      appliedJobIds: new Set(
        (applicationsQuery.data ?? emptyApplications).map((application) => application.jobPostId),
      ),
    }),
    [applicationsQuery.data, followedCompaniesQuery.data, profileQuery.data, savedJobsQuery.data],
  );

  const state: HomeCandidateState = useMemo(() => {
    if (!isSessionResolved) return "resolving";
    if (!session) return "guest";
    if (profileQuery.isPending) return "resolving";
    if (profileQuery.isError) return "unavailable";
    if (candidateContext.profile?.jobSearchStatus === "NOT_LOOKING") return "not-looking";
    return hasSufficientCandidateSignals(candidateContext) ? "ready" : "profile-incomplete";
  }, [candidateContext, isSessionResolved, profileQuery.isError, profileQuery.isPending, session]);

  const isActivityResolved =
    !session ||
    (!applicationsQuery.isPending &&
      !savedJobsQuery.isPending &&
      !followedCompaniesQuery.isPending &&
      !applicationsQuery.isError &&
      !savedJobsQuery.isError &&
      !followedCompaniesQuery.isError);

  return {
    candidateContext,
    cvsCount: cvsQuery.data?.items.length ?? 0,
    isActivityResolved,
    isSessionResolved,
    profileQuery,
    session,
    state,
  };
}
