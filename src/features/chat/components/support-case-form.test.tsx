import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/support-cases", () => ({
  createSupportCase: vi.fn<() => void>(),
  getSupportCaseCreationOptions: vi.fn<() => void>(),
}));

vi.mock("../socket/chat-socket-provider", () => ({
  useChatSocket: () => ({
    token: "recruiter-token",
    identity: { companyId: "company-id" },
  }),
}));

import { getSupportCaseCreationOptions } from "../api/support-cases";
import { SupportCaseForm } from "./support-case-form";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;
HTMLElement.prototype.scrollIntoView = () => undefined;

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return render(<SupportCaseForm />, { wrapper: Wrapper });
}

async function chooseCategory(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Tạo yêu cầu" }));
  const combobox = await screen.findByRole("combobox", {}, { timeout: 2000 });
  await user.click(combobox);
  const option = await screen.findByRole("option", { name }, { timeout: 2000 });
  await user.click(option);
  return user;
}

function creationOptions({
  jobPosts = [],
  invoices = [],
  company = {},
}: {
  jobPosts?: Array<{
    id: string;
    title: string;
    moderationStatus: "PENDING" | "REJECTED";
  }>;
  invoices?: Array<{
    id: string;
    invoiceCode: string;
    amount: string | number;
    paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    createdAt: string;
  }>;
  company?: Partial<{
    id: string;
    name: string;
    status: "ACTIVE" | "LOCKED";
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
    eligibleForVerificationSupport: boolean;
  }>;
} = {}) {
  return {
    data: {
      jobPosts,
      invoices,
      company: {
        id: "company-id",
        name: "UpNext Company",
        status: "ACTIVE" as const,
        verificationStatus: "VERIFIED" as const,
        eligibleForVerificationSupport: false,
        ...company,
      },
    },
  };
}

describe("SupportCaseForm", () => {
  beforeEach(() => {
    vi.mocked(getSupportCaseCreationOptions).mockReset();
  });

  it("shows pending and rejected company job posts in a dropdown", async () => {
    vi.mocked(getSupportCaseCreationOptions).mockResolvedValue(
      creationOptions({
        jobPosts: [
          { id: "pending-job", title: "Backend Developer", moderationStatus: "PENDING" },
          { id: "rejected-job", title: "Frontend Developer", moderationStatus: "REJECTED" },
        ],
      }),
    );
    renderForm();

    const user = await chooseCategory("Duyệt tin tuyển dụng");
    const jobPostSelect = await screen.findByRole("combobox", {
      name: "Tin tuyển dụng cần hỗ trợ",
    });
    expect(screen.queryByPlaceholderText("ID tin tuyển dụng")).not.toBeInTheDocument();

    await user.click(jobPostSelect);
    expect(
      screen.getByRole("option", { name: "Backend Developer — Đang chờ duyệt" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Frontend Developer — Bị từ chối" }),
    ).toBeInTheDocument();
  });

  it("explains that all jobs are approved and prevents submission when none are eligible", async () => {
    vi.mocked(getSupportCaseCreationOptions).mockResolvedValue(creationOptions());
    renderForm();

    await chooseCategory("Duyệt tin tuyển dụng");

    expect(
      await screen.findByText("Tất cả tin tuyển dụng của bạn đã được duyệt."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeDisabled();
    expect(
      screen.queryByRole("combobox", { name: "Tin tuyển dụng cần hỗ trợ" }),
    ).not.toBeInTheDocument();
  });

  it("lists company invoices instead of asking for an invoice UUID", async () => {
    vi.mocked(getSupportCaseCreationOptions).mockResolvedValue(
      creationOptions({
        invoices: [
          {
            id: "invoice-id",
            invoiceCode: "INV-2026-001",
            amount: "1500000",
            paymentStatus: "PENDING",
            createdAt: "2026-07-18T00:00:00.000Z",
          },
        ],
      }),
    );
    renderForm();

    const user = await chooseCategory("Hóa đơn");
    const invoiceSelect = await screen.findByRole("combobox", { name: "Hóa đơn cần hỗ trợ" });
    expect(screen.queryByPlaceholderText("ID hóa đơn")).not.toBeInTheDocument();

    await user.click(invoiceSelect);
    expect(
      screen.getByRole("option", {
        name: "INV-2026-001 — Chờ thanh toán — 1.500.000 ₫",
      }),
    ).toBeInTheDocument();
  });

  it("prevents billing support when the company has no invoice", async () => {
    vi.mocked(getSupportCaseCreationOptions).mockResolvedValue(creationOptions());
    renderForm();

    await chooseCategory("Thanh toán");

    expect(
      await screen.findByText("Công ty của bạn chưa có hóa đơn để yêu cầu hỗ trợ."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeDisabled();
  });

  it("auto-links an eligible company and blocks verification support after approval", async () => {
    vi.mocked(getSupportCaseCreationOptions).mockResolvedValue(
      creationOptions({
        company: {
          verificationStatus: "PENDING",
          eligibleForVerificationSupport: true,
        },
      }),
    );
    const firstRender = renderForm();
    await chooseCategory("Xác minh công ty");
    expect(await screen.findByText("UpNext Company — Đang chờ xác minh")).toBeInTheDocument();
    firstRender.unmount();

    vi.mocked(getSupportCaseCreationOptions).mockResolvedValue(
      creationOptions({ company: { verificationStatus: "VERIFIED" } }),
    );
    renderForm();
    await chooseCategory("Xác minh công ty");
    expect(await screen.findByText("Công ty của bạn đã được xác minh.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeDisabled();
  });
});
