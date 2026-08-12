import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/vi.json";
import { AiRunTimeline } from "./ai-run-timeline";
import { AiStateNotice } from "./ai-state-notice";

function renderWithIntl(node: ReactNode) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );
}

describe("AI Copilot feedback states", () => {
  it("explains a failure in user-facing language and offers a retry", () => {
    const onRetry = vi.fn<() => void>();
    renderWithIntl(<AiStateNotice status="failed" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Không tạo được câu trả lời");
    expect(screen.getByRole("alert")).toHaveTextContent("Mình chưa thể hoàn thiện câu trả lời này");
    expect(screen.queryByText("AI_INVALID_OUTPUT: provider diagnostic")).not.toBeInTheDocument();
    expect(screen.queryByText(/AI_[A-Z_]+/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not offer an immediate retry when the quota is exhausted", () => {
    renderWithIntl(<AiStateNotice status="rate_limited" onRetry={vi.fn<() => void>()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Bạn đã dùng hết hạn mức");
    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
  });

  it("shows friendly data-source labels without exposing internal tool names", () => {
    renderWithIntl(
      <AiRunTimeline
        status="failed"
        toolCalls={[
          {
            id: "tool-1",
            name: "get_own_cv",
            label: "CV đang dùng",
            detail: "Đã kiểm tra phiên bản CV mới nhất của bạn.",
            status: "succeeded",
            durationMs: 420,
          },
          {
            id: "tool-2",
            name: "search_jobs",
            label: "Việc làm phù hợp",
            detail: "Chưa thể tải nguồn dữ liệu này.",
            status: "failed",
          },
        ]}
      />,
    );

    expect(screen.getByText("CV đang dùng")).toBeInTheDocument();
    expect(screen.getByText("Việc làm phù hợp")).toBeInTheDocument();
    expect(screen.queryByText("get_own_cv")).not.toBeInTheDocument();
    expect(screen.queryByText("search_jobs")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", { name: /Đã kiểm tra 1\/2 nguồn dữ liệu/ });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
