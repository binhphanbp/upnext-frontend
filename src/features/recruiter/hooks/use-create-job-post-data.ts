"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createJobPost,
  getEmploymentTypes,
  getExperienceLevels,
  getJobCategories,
  type CreateJobPostPayload,
} from "@/features/recruiter/api/job-posts";
import { getRecruiterAccounts } from "@/features/recruiter/api/recruiter-accounts";
import { env } from "@/shared/lib/env";

const recruiterAccountsQueryKey = ["recruiter-accounts"] as const;
const jobCategoriesQueryKey = ["job-categories"] as const;
const experienceLevelsQueryKey = ["experience-levels"] as const;
const employmentTypesQueryKey = ["employment-types"] as const;

export function useCreateJobPostData() {
  const companyId = env.NEXT_PUBLIC_RECRUITER_COMPANY_ID;

  const recruiterAccountsQuery = useQuery({
    queryKey: recruiterAccountsQueryKey,
    queryFn: getRecruiterAccounts,
  });

  const jobCategoriesQuery = useQuery({
    queryKey: jobCategoriesQueryKey,
    queryFn: getJobCategories,
  });

  const experienceLevelsQuery = useQuery({
    queryKey: experienceLevelsQueryKey,
    queryFn: getExperienceLevels,
  });

  const employmentTypesQuery = useQuery({
    queryKey: employmentTypesQueryKey,
    queryFn: getEmploymentTypes,
  });

  const recruiterAccount =
    recruiterAccountsQuery.data?.items.find(
      (account) => account.companyId === companyId && account.status === "ACTIVE",
    ) ?? null;

  const createJobPostMutation = useMutation({
    mutationFn: (payload: Omit<CreateJobPostPayload, "companyId" | "recruiterId">) => {
      if (!recruiterAccount?.id) {
        throw new Error("Không tìm thấy tài khoản tuyển dụng đang hoạt động cho công ty hiện tại.");
      }

      return createJobPost({
        ...payload,
        companyId,
        recruiterId: recruiterAccount.id,
      });
    },
  });

  return {
    createJobPostMutation,
    employmentTypes: employmentTypesQuery.data ?? [],
    error:
      recruiterAccountsQuery.error ??
      jobCategoriesQuery.error ??
      experienceLevelsQuery.error ??
      employmentTypesQuery.error ??
      null,
    experienceLevels: experienceLevelsQuery.data ?? [],
    isLoading:
      recruiterAccountsQuery.isLoading ||
      jobCategoriesQuery.isLoading ||
      experienceLevelsQuery.isLoading ||
      employmentTypesQuery.isLoading,
    jobCategories: jobCategoriesQuery.data ?? [],
    recruiterAccount,
  };
}
