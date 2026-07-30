import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { JobPostSalaryInsightResponse } from "./api";
import { JobPostSalaryInsight } from "./job-post-salary-insight";

const insight: JobPostSalaryInsightResponse = {
  available: true,
  basis: "UPNEXT_PUBLIC_JOB_POSTS",
  currency: "VND",
  period: "MONTH",
  sampleSize: 18,
  lookbackMonths: 18,
  confidence: "MEDIUM",
  market: {
    p25: 27_500_000,
    median: 30_000_000,
    p75: 32_500_000,
  },
  recommended: {
    salaryMin: 27_500_000,
    salaryMax: 32_500_000,
  },
  comparison: {
    position: "ALIGNED",
    differencePercent: 2,
  },
  matchedFactors: ["Chức danh tương đồng", "Cùng cấp bậc"],
  message: "Dữ liệu tham chiếu.",
};

describe("JobPostSalaryInsight", () => {
  it("shows the market sample and applies the suggested range", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn<() => void>();

    render(
      <JobPostSalaryInsight
        insight={insight}
        isLoading={false}
        errorMessage=""
        experienceYears="3"
        canAnalyze
        onExperienceYearsChange={vi.fn<(value: string) => void>()}
        onAnalyze={vi.fn<() => void>()}
        onApply={onApply}
      />,
    );

    expect(screen.getByText("18 tin tương đồng · 18 tháng gần nhất")).toBeInTheDocument();
    expect(screen.getByText(/Mức đang nhập nằm trong khoảng thị trường/u)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Áp dụng khoảng/u }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it("requires job content and years of experience before enabling analysis", async () => {
    const user = userEvent.setup();
    const onExperienceYearsChange = vi.fn<(value: string) => void>();

    render(
      <JobPostSalaryInsight
        insight={null}
        isLoading={false}
        errorMessage=""
        experienceYears=""
        canAnalyze={false}
        onExperienceYearsChange={onExperienceYearsChange}
        onAnalyze={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole("button", { name: "Phân tích mức lương" })).toBeDisabled();
    expect(screen.getByText(/số năm kinh nghiệm hợp lệ/u)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Số năm kinh nghiệm/u), "1");
    expect(onExperienceYearsChange).toHaveBeenCalledWith("1");
  });

  it("shows cited web sources for a Google-grounded salary result", async () => {
    const user = userEvent.setup();
    const webInsight: JobPostSalaryInsightResponse = {
      ...insight,
      basis: "WEB_GROUNDED_AI",
      sampleSize: 3,
      marketSummary: "Khoảng lương được tổng hợp từ các báo cáo và tin tuyển dụng.",
      sources: [
        { title: "ITviec", url: "https://example.com/itviec" },
        { title: "TopCV", url: "https://example.com/topcv" },
        { title: "Reeracoen", url: "https://example.com/reeracoen" },
      ],
      searchedAt: "2026-07-25T10:00:00.000Z",
    };

    render(
      <JobPostSalaryInsight
        insight={webInsight}
        isLoading={false}
        errorMessage=""
        experienceYears="2"
        canAnalyze
        onExperienceYearsChange={vi.fn<(value: string) => void>()}
        onAnalyze={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByText("Google Search + Gemini AI")).toBeInTheDocument();
    await user.click(screen.getByText("Nguồn web tham khảo (3)"));
    expect(screen.getByRole("link", { name: /ITviec/u })).toHaveAttribute(
      "href",
      "https://example.com/itviec",
    );
  });

  it("counts down the estimated research time while the AI is working", () => {
    vi.useFakeTimers();
    try {
      render(
        <JobPostSalaryInsight
          insight={null}
          isLoading
          errorMessage=""
          experienceYears="3"
          canAnalyze
          onExperienceYearsChange={vi.fn<(value: string) => void>()}
          onAnalyze={vi.fn<() => void>()}
        />,
      );

      expect(screen.getByText("AI đang tra cứu nguồn web...")).toBeInTheDocument();
      expect(screen.getByText("Dự kiến còn khoảng 35 giây")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText("Dự kiến còn khoảng 32 giây")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      expect(screen.getByText("Sắp xong, AI đang đối chiếu các nguồn...")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
