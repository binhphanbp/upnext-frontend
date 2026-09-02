"use client";

import { Briefcase, Code } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import { getTaxonomyStats, type TaxonomyStats } from "@/features/admin/api/taxonomy";
import { getAdminSession } from "@/features/admin/session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { JobCategoriesTab } from "./job-categories-tab";
import { SkillsManagementTab } from "./skills-management-tab";
import { TaxonomyKpiCards } from "./taxonomy-kpi-cards";

export function TaxonomyManagementPage() {
  const [activeTab, setActiveTab] = React.useState("skills");

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery<TaxonomyStats>({
    queryKey: ["taxonomyStats"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getTaxonomyStats(session.accessToken);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Context Description */}
      <div className="-mt-1">
        <p className="text-sm text-slate-500">
          Dữ liệu gốc chuẩn hóa cho thuật toán AI JD-CV Matcher, bộ lọc tìm kiếm và form đăng tin
          tuyển dụng toàn hệ thống.
        </p>
      </div>

      {/* KPI Cards */}
      <TaxonomyKpiCards stats={stats ?? null} loading={loadingStats} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-[440px]">
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Code size={16} weight="bold" />
            Kỹ năng chuẩn ({stats?.totalSkills ?? "..."})
          </TabsTrigger>
          <TabsTrigger value="job-categories" className="flex items-center gap-2">
            <Briefcase size={16} weight="bold" />
            Ngành nghề ({stats?.totalJobCategories ?? "..."})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="mt-6 outline-none">
          <SkillsManagementTab onStatsChange={() => void refetchStats()} />
        </TabsContent>

        <TabsContent value="job-categories" className="mt-6 outline-none">
          <JobCategoriesTab onStatsChange={() => void refetchStats()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
