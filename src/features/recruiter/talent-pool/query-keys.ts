export type TalentPoolSearchKeyParams = Readonly<{
  city?: string;
  skillIds?: readonly string[];
  page?: number;
  pageSize?: number;
}>;

export const talentPoolKeys = {
  all: ["recruiter", "talent-pool"] as const,
  capabilities: () => [...talentPoolKeys.all, "capabilities"] as const,
  search: (params: TalentPoolSearchKeyParams) => [...talentPoolKeys.all, "search", params] as const,
  detail: (candidateProfileId: string) =>
    [...talentPoolKeys.all, "detail", candidateProfileId] as const,
};
