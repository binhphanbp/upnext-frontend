import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn<() => void>() }) }));
vi.mock("../api/support-cases", () => ({
  changeSupportCaseStatus: vi.fn<() => void>(),
  claimSupportCase: vi.fn<() => void>(),
  getEligibleSupportAssignees: vi.fn<() => void>(),
  getSupportCase: vi.fn<() => void>(),
  transferSupportCase: vi.fn<() => void>(),
}));
vi.mock("../hooks/use-conversations", () => ({ useConversation: () => ({ data: null }) }));
vi.mock("../socket/chat-socket-provider", () => ({
  useChatSocket: () => ({
    token: "admin-token",
    identity: {
      id: "current-admin",
      permissions: ["support:transfer", "support:job_review:handle"],
    },
  }),
}));
vi.mock("./admin-support-queue", () => ({ supportLabel: (value: string) => value }));
vi.mock("./conversation-context-panel", () => ({ ConversationContextPanel: () => null }));
vi.mock("./conversation-thread", () => ({ ConversationThread: () => null }));

import { getEligibleSupportAssignees, getSupportCase } from "../api/support-cases";
import { AdminSupportCaseDetail } from "./admin-support-case-detail";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => undefined;
HTMLElement.prototype.releasePointerCapture = () => undefined;
HTMLElement.prototype.scrollIntoView = () => undefined;

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AdminSupportCaseDetail caseId="case-id" />, { wrapper: Wrapper });
}

describe("AdminSupportCaseDetail", () => {
  beforeEach(() => {
    vi.mocked(getSupportCase).mockResolvedValue({
      data: {
        id: "case-id",
        caseNumber: "SUP-001",
        clientRequestId: "request-id",
        conversationId: "conversation-id",
        companyId: "company-id",
        createdByRecruiterId: "recruiter-id",
        assignedAdminUserId: "current-admin",
        department: "JOB_REVIEW",
        categoryCode: "JOB_REVIEW",
        priority: "NORMAL",
        status: "IN_PROGRESS",
        title: "Hỗ trợ duyệt tin",
        description: "Cần hỗ trợ duyệt tin tuyển dụng",
        resolutionCode: null,
        resolutionSummary: null,
        version: 1,
        createdAt: "2026-07-18T00:00:00.000Z",
        updatedAt: "2026-07-18T00:00:00.000Z",
        conversation: { id: "conversation-id", status: "ACTIVE", latestMessageAt: null },
      },
    });
    vi.mocked(getEligibleSupportAssignees).mockResolvedValue({
      data: [
        {
          id: "next-admin",
          fullName: "Nguyễn Admin",
          email: "admin@upnext.dev",
          role: { roleName: "Job Review" },
        },
      ],
    });
  });

  it("renders eligible admins in a dropdown instead of a UUID input", async () => {
    const user = userEvent.setup();
    renderDetail();

    const assigneeSelect = await screen.findByRole(
      "combobox",
      {
        name: "Admin nhận chuyển giao",
      },
      { timeout: 3000 },
    );
    expect(screen.queryByPlaceholderText("UUID admin nhận chuyển")).not.toBeInTheDocument();
    await user.click(assigneeSelect);
    expect(screen.getByRole("option", { name: "Nguyễn Admin — Job Review" })).toBeInTheDocument();
  });
});
