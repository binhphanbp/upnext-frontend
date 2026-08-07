import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/vi.json";
import type { GenerateJobPostDraftPayload, JobPostCatalogs } from "./api";
import { JobPostAiGeneratorForm } from "./job-post-ai-generator-form";

const catalogs: JobPostCatalogs = {
  categories: [{ id: "category-1", name: "Công nghệ thông tin" }],
  employmentTypes: [{ id: "employment-1", name: "Toàn thời gian" }],
  experienceLevels: [{ id: "level-1", name: "Senior" }],
  skills: [{ id: "skill-react", name: "React" }],
  specializations: [],
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("JobPostAiGeneratorForm", () => {
  it("requires a title and at least one skill or keyword", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<(payload: GenerateJobPostDraftPayload) => Promise<boolean>>()
      .mockResolvedValue(false);

    renderWithIntl(
      <JobPostAiGeneratorForm
        catalogs={catalogs}
        companyDescription=""
        isSubmitting={false}
        onCancel={vi.fn<() => void>()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tạo JD với AI" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Vui lòng nhập chức danh công việc.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the IT context with the standard skill-first layout", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn<(payload: GenerateJobPostDraftPayload) => Promise<boolean>>()
      .mockResolvedValue(true);

    renderWithIntl(
      <JobPostAiGeneratorForm
        catalogs={catalogs}
        companyDescription="Nền tảng tuyển dụng IT"
        isSubmitting={false}
        onCancel={vi.fn<() => void>()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/Chức danh công việc/u), "Senior React Developer");
    await user.type(
      screen.getByLabelText("Thêm kỹ năng hoặc từ khóa liên quan"),
      "Fintech, Microservices",
    );
    await user.type(screen.getByLabelText(/Số năm kinh nghiệm/u), "3");
    await user.click(screen.getByRole("button", { name: "Tạo JD với AI" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Senior React Developer",
        keywords: ["Fintech", "Microservices"],
        companyDescription: "Nền tảng tuyển dụng IT",
        yearsOfExperience: "3",
        outputLanguage: "vi",
        presentationStyle: "skill_focused",
      }),
    );
  }, 20000);
});
