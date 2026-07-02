"use client";

import { Briefcase, ChartLineUp, UserCheck, Users } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import {
  updatePipelineCandidateStage,
  type PipelineStageId,
  type RecruiterPipelineResponse,
} from "@/features/recruiter/api/pipeline";
import { useRecruiterPipeline } from "@/features/recruiter/hooks/use-recruiter-pipeline";
import { getRecruiterJobPosts, type RecruiterJobPost } from "@/features/recruiter/job-posts/api";
import { getRecruiterSession } from "@/features/recruiter/session";

import { MetricCard } from "./metric-card";
import { PipelineBoard } from "./pipeline-board";
import { PipelineHeader } from "./pipeline-header";
import { PIPELINE_STAGES } from "./pipeline-mock-data";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

export function RecruiterPipelinePage() {
  const t = useTranslations("Recruiter");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [token, setToken] = useState<string | null>(null);
  const [recruiterId, setRecruiterId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("all");
  const [jobs, setJobs] = useState<RecruiterJobPost[]>([]);

  // Load recruiter session & initial jobs
  useEffect(() => {
    const session = getRecruiterSession();
    if (session) {
      setToken(session.accessToken);
      setRecruiterId(session.user.id);
      getRecruiterJobPosts(session.accessToken, session.user.id).then(setJobs).catch(console.error);
    }
  }, []);

  const queryParams = useMemo(
    () => ({
      search,
      jobPostId: selectedJobId,
    }),
    [search, selectedJobId],
  );

  // Use real backend data hook
  const { data, isLoading, isError, refetch } = useRecruiterPipeline(token, queryParams);

  // Define mutation with optimistic updates
  const mutation = useMutation({
    mutationFn: async ({
      applicationId,
      stageId,
    }: {
      applicationId: string;
      stageId: PipelineStageId;
    }) => {
      if (!token) throw new Error("No token available");
      return updatePipelineCandidateStage(applicationId, stageId, token);
    },
    onMutate: async ({ applicationId, stageId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recruiter", "pipeline", queryParams] });

      // Snapshot the previous query data
      const previousPipelineData = queryClient.getQueryData<RecruiterPipelineResponse>([
        "recruiter",
        "pipeline",
        queryParams,
      ]);

      // Optimistically update the pipeline cache
      if (previousPipelineData) {
        const updatedCandidates = previousPipelineData.candidates.map((c) =>
          c.applicationId === applicationId ? { ...c, stageId } : c,
        );
        queryClient.setQueryData<RecruiterPipelineResponse>(
          ["recruiter", "pipeline", queryParams],
          {
            ...previousPipelineData,
            candidates: updatedCandidates,
          },
        );
      }

      return { previousPipelineData };
    },
    onError: (err, variables, context) => {
      // Rollback to previous state
      if (context?.previousPipelineData) {
        queryClient.setQueryData(
          ["recruiter", "pipeline", queryParams],
          context.previousPipelineData,
        );
      }
      void toast.fire({
        icon: "error",
        title:
          locale === "vi" ? "Lỗi cập nhật trạng thái ứng viên" : "Error updating candidate stage",
      });
    },
    onSuccess: () => {
      void toast.fire({
        icon: "success",
        title: locale === "vi" ? "Đã cập nhật trạng thái ứng viên" : "Updated candidate status",
      });
    },
    onSettled: () => {
      // Invalidate to refetch fresh data from the server
      void queryClient.invalidateQueries({ queryKey: ["recruiter", "pipeline", queryParams] });
    },
  });

  // Get distinct roles for filtering
  const roleOptions = useMemo(() => {
    return [
      { label: t("pipeline.filters.allJobs"), value: "all" },
      ...jobs.map((job) => ({ label: job.title, value: job.id })),
    ];
  }, [jobs, t]);

  const hasActiveFilters = search.trim().length > 0 || selectedJobId !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setSelectedJobId("all");
  };

  const filteredCandidates = data?.candidates ?? [];
  const metrics = data?.metrics ?? {
    totalCandidates: 0,
    inInterview: 0,
    offersSent: 0,
    passRate: 0,
  };

  const handleCandidateMove = (candidateId: string, targetStageId: PipelineStageId) => {
    const candidate = filteredCandidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    mutation.mutate({
      applicationId: candidate.applicationId,
      stageId: targetStageId,
    });
  };

  // Loading skeleton screen
  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] flex-col gap-6 bg-slate-50/10 p-6">
        <div className="flex shrink-0 flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("pipeline.title")}
          </h1>
          <div className="h-4 w-64 animate-pulse rounded bg-slate-200"></div>
        </div>

        {/* Skeleton Metrics */}
        <div className="grid shrink-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
            ></div>
          ))}
        </div>

        {/* Skeleton Header */}
        <div className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white p-5"></div>

        {/* Skeleton Columns */}
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[400px] w-[300px] shrink-0 animate-pulse rounded-xl border border-slate-200 bg-slate-50/50"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  // Error state screen
  if (isError) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-slate-50/10 p-6 text-center">
        <div className="mb-4 flex size-14 animate-bounce items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600">
          <Users size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không thể tải dữ liệu pipeline</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng kiểm tra lại kết nối mạng của bạn.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col gap-6 bg-slate-50/10 p-6">
      {/* Title & Description Header */}
      <div className="flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("pipeline.title")}</h1>
        <p className="text-sm font-medium text-slate-500">{t("pipeline.subtitle")}</p>
      </div>

      {/* Filter Header Component */}
      <PipelineHeader
        search={search}
        onSearchChange={setSearch}
        selectedRole={selectedJobId}
        onRoleChange={setSelectedJobId}
        roleOptions={roleOptions}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Kanban Board Component or Empty State */}
      {filteredCandidates.length > 0 ? (
        <PipelineBoard
          stages={data?.stages ?? PIPELINE_STAGES}
          candidates={filteredCandidates}
          onCandidateMove={handleCandidateMove}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 py-20 text-center shadow-xs">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
            <Users size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t("pipeline.emptyState.title")}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {t("pipeline.emptyState.description")}
          </p>
          <button
            onClick={handleClearFilters}
            className="mt-4 cursor-pointer rounded-lg border border-emerald-200/50 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100/70"
          >
            {t("pipeline.emptyState.clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}
