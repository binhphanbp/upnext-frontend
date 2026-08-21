import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import type { RecruiterJobPost } from "@/features/recruiter/job-posts/api";

import messages from "../../../../../messages/vi.json";
import { ScheduleInterviewDialog } from "./schedule-interview-dialog";

vi.mock("@/features/recruiter/api/interviews", () => ({
  createInterview: vi.fn().mockResolvedValue({ id: "interview-123" }),
  getRecruiterInterviews: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/recruiter/api/onboarding", () => ({
  getRecruiterAccount: vi.fn().mockResolvedValue({ company: { id: "company-1" } }),
  getCompanyLocations: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/features/recruiter/api/team", () => ({
  getCompanyApplications: vi.fn().mockResolvedValue([
    {
      id: "app-1",
      status: "SHORTLISTED",
      candidateProfile: {
        account: {
          fullName: "Nguyen Van A",
          email: "vana@example.com",
        },
      },
      jobPost: {
        id: "job-1",
        title: "Frontend Developer",
      },
    },
  ]),
  getCompanyMembers: vi.fn().mockResolvedValue([]),
  isRecruiterMissingCompanyError: vi.fn().mockReturnValue(false),
}));

vi.mock("@/features/recruiter/session", () => ({
  getRecruiterSession: vi.fn().mockReturnValue({
    accessToken: "fake-token",
    user: { id: "recruiter-1" },
  }),
}));

const mockJobs: RecruiterJobPost[] = [
  {
    id: "job-1",
    title: "Frontend Developer",
    slug: "frontend-developer",
    status: "PUBLISHED",
    type: "FULL_TIME",
    experienceLevel: "MID",
    currency: "VND",
    salaryMin: 15000000,
    salaryMax: 25000000,
    workMode: "HYBRID",
    workLocation: "Ho Chi Minh",
    recruiterProfileId: "recruiter-1",
    companyId: "company-1",
    expiredAt: "2026-12-31T23:59:59.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as unknown as RecruiterJobPost,
];

function renderDialog(props: Partial<React.ComponentProps<typeof ScheduleInterviewDialog>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <ScheduleInterviewDialog
          token="fake-token"
          jobs={mockJobs}
          open={true}
          onOpenChange={vi.fn()}
          {...props}
        />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("ScheduleInterviewDialog date and time selection", () => {
  it("renders with empty date and time fields without premature error", () => {
    renderDialog();

    expect(screen.getByText("Thời gian bắt đầu")).toBeInTheDocument();
    expect(screen.getByText("Thời gian kết thúc")).toBeInTheDocument();

    // No past date errors or end time errors initially
    expect(screen.queryByText(/Thời gian phỏng vấn phải ở tương lai/u)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Thời gian kết thúc phải sau thời gian bắt đầu/u),
    ).not.toBeInTheDocument();
  });

  it("updates start hour and auto-suggests end time cleanly", async () => {
    const user = userEvent.setup();
    renderDialog();

    const startHourSelect = screen.getByLabelText(/Thời gian bắt đầu — giờ/u);
    const startMinuteSelect = screen.getByLabelText(/Thời gian bắt đầu — phút/u);
    const endHourSelect = screen.getByLabelText(/Thời gian kết thúc — giờ/u);
    const endMinuteSelect = screen.getByLabelText(/Thời gian kết thúc — phút/u);

    // Initial state is empty "--"
    expect(startHourSelect).toHaveValue("");
    expect(endHourSelect).toHaveValue("");

    // User selects start hour 09
    await user.selectOptions(startHourSelect, "09");

    // Start hour is 09, minute defaults to 00
    expect(startHourSelect).toHaveValue("09");
    expect(startMinuteSelect).toHaveValue("00");

    // End hour auto-suggests to 10:00
    expect(endHourSelect).toHaveValue("10");
    expect(endMinuteSelect).toHaveValue("00");
  });

  it("allows selecting custom end time", async () => {
    const user = userEvent.setup();
    renderDialog();

    const startHourSelect = screen.getByLabelText(/Thời gian bắt đầu — giờ/u);
    const endHourSelect = screen.getByLabelText(/Thời gian kết thúc — giờ/u);
    const endMinuteSelect = screen.getByLabelText(/Thời gian kết thúc — phút/u);

    await user.selectOptions(startHourSelect, "09");
    expect(endHourSelect).toHaveValue("10");

    // User changes end time to 11:30
    await user.selectOptions(endHourSelect, "11");
    await user.selectOptions(endMinuteSelect, "30");

    expect(endHourSelect).toHaveValue("11");
    expect(endMinuteSelect).toHaveValue("30");
  });

  it("allows selecting a date from the calendar popover inside the dialog", async () => {
    const user = userEvent.setup();
    renderDialog();

    const startPickers = screen.getAllByRole("button", { name: /Chọn ngày/u });
    const startDateButton = startPickers[0];
    expect(startDateButton).toBeDefined();
    if (!startDateButton) return;

    // Click trigger to open DatePicker popover
    await user.click(startDateButton);

    // The calendar table should be visible
    expect(screen.getByRole("grid")).toBeInTheDocument();

    // Find and click on a day (e.g. today or next day)
    // Or click "Hôm nay" button in popover footer
    const todayButton = screen.queryByRole("button", { name: "Hôm nay" });
    if (todayButton) {
      await user.click(todayButton);
      // Date should be selected
      expect(startDateButton).not.toHaveTextContent("Chọn ngày");
    }
  });

  it("filters out candidates who already have an active scheduled interview", async () => {
    const { getRecruiterInterviews } = await import("@/features/recruiter/api/interviews");
    const { getCompanyApplications } = await import("@/features/recruiter/api/team");

    vi.mocked(getCompanyApplications).mockResolvedValueOnce([
      {
        id: "app-1",
        status: "SHORTLISTED",
        candidateProfile: {
          account: {
            fullName: "Nguyen Van A",
            email: "vana@example.com",
          },
        },
        jobPost: { id: "job-1", title: "Frontend Developer" },
      } as any,
      {
        id: "app-2",
        status: "SHORTLISTED",
        candidateProfile: {
          account: {
            fullName: "Tran Van B",
            email: "vanb@example.com",
          },
        },
        jobPost: { id: "job-1", title: "Frontend Developer" },
      } as any,
    ]);

    vi.mocked(getRecruiterInterviews).mockResolvedValueOnce([
      {
        id: "interview-1",
        applicationId: "app-1",
        status: "SCHEDULED",
        scheduledStartAt: "2026-08-25T09:00:00.000Z",
        scheduledEndAt: "2026-08-25T10:00:00.000Z",
      } as any,
    ]);

    const user = userEvent.setup();
    renderDialog({ initialValues: { jobId: "job-1", applicationId: "", interviewRound: 1 } });

    // Open candidate dropdown
    const candidateTrigger = await screen.findByText(/Chọn ứng viên/u);
    await user.click(candidateTrigger);

    // app-1 (Nguyen Van A) is SCHEDULED, so it should NOT be in the list
    expect(screen.queryByText(/Nguyen Van A/u)).not.toBeInTheDocument();

    // app-2 (Tran Van B) has no interview, so it SHOULD be in the list
    expect(screen.getByText(/Tran Van B/u)).toBeInTheDocument();
  });
});
