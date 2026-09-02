"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getRecruiterSession } from "@/features/recruiter/session";

import {
  aiSearchTalentPool,
  getCvDownloadUrl,
  getTalentPoolCapabilities,
  searchTalentPool,
  viewTalentPoolDetail,
  type TalentPoolSearchParams,
} from "./api";
import { talentPoolKeys } from "./query-keys";

function requireSession() {
  const session = getRecruiterSession();
  if (!session) throw new Error("No session");
  return session;
}

export function useTalentPoolCapabilities() {
  return useQuery({
    queryKey: talentPoolKeys.capabilities(),
    queryFn: () => getTalentPoolCapabilities(requireSession().accessToken),
    // Quota đổi mỗi lần xem chi tiết -- giữ ngắn để banner không hiện số cũ.
    staleTime: 15_000,
  });
}

export function useTalentPoolSearch(params: TalentPoolSearchParams) {
  return useQuery({
    // `exactOptionalPropertyTypes` cấm gán `undefined` tường minh cho một field
    // optional -- lọc field rỗng trước khi dựng key, thay vì spread nguyên
    // `params` (có thể mang `undefined`).
    queryKey: talentPoolKeys.search(
      Object.fromEntries(
        Object.entries({
          city: params.city,
          skillIds: params.skillIds,
          page: params.page,
          pageSize: params.pageSize,
        }).filter(([, value]) => value !== undefined),
      ),
    ),
    queryFn: () => searchTalentPool(params, requireSession().accessToken),
    staleTime: 30_000,
  });
}

/**
 * Xem chi tiết một hồ sơ.
 *
 * `gcTime` ngắn và không đọc cache cũ khi mount lại: nếu công ty vừa nâng gói
 * (đổi `unlocked`) và mở lại đúng hồ sơ đó, họ phải thấy trạng thái mới ngay,
 * không phải bản che PII đã cache từ trước khi nâng gói.
 */
export function useViewTalentPoolDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateProfileId: string) =>
      viewTalentPoolDetail(candidateProfileId, requireSession().accessToken),
    onSuccess: (result, candidateProfileId) => {
      queryClient.setQueryData(talentPoolKeys.detail(candidateProfileId), result.data);
      // Đã xem có thể vừa trừ 1 lượt -- nạp lại capabilities và danh sách để
      // banner quota và cờ `viewedThisPeriod` khớp ngay.
      void queryClient.invalidateQueries({ queryKey: talentPoolKeys.capabilities() });
      void queryClient.invalidateQueries({ queryKey: [...talentPoolKeys.all, "search"] });
    },
  });
}

export function useCvDownload() {
  return useMutation({
    mutationFn: (candidateProfileId: string) =>
      getCvDownloadUrl(candidateProfileId, requireSession().accessToken),
  });
}

/**
 * AI lọc Kho CV theo JD.
 *
 * Không có `stableRequestKey` theo *ý định* như Discovery: mỗi lần recruiter
 * đổi tin và bấm lọc lại là một ý định mới đáng được tính phí riêng, và không
 * có rủi ro double-submit đáng lo ở đây (một lần bấm, một request, UI khoá nút
 * trong lúc chờ). Vẫn cần MỘT key ổn định cho chính lần gọi đó để nếu network
 * lỗi giữa chừng và React Query tự thử lại, backend không trừ hai lần.
 */
export function useAiSearchTalentPool() {
  return useMutation({
    mutationFn: ({ jobPostId, idempotencyKey }: { jobPostId: string; idempotencyKey: string }) =>
      aiSearchTalentPool(jobPostId, idempotencyKey, requireSession().accessToken),
  });
}
