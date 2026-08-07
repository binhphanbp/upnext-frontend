import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AiCitation } from "../types";
import { AiMarkdown } from "./ai-markdown";

const citation: AiCitation = {
  id: "c1",
  index: 1,
  sourceType: "CV",
  sourceId: "cv-v3",
  title: "CV_v3.pdf — Kinh nghiệm",
  excerpt: "Backend Developer, UpNext JSC",
};

describe("AiMarkdown", () => {
  it("resolves a [n] marker into a clickable citation chip", () => {
    const onCitationClick = vi.fn();
    render(
      <AiMarkdown
        content="CV của bạn đạt 78 điểm [1]."
        citations={[citation]}
        onCitationClick={onCitationClick}
      />,
    );

    const chip = screen.getByRole("button", { name: `Nguồn 1: ${citation.title}` });
    chip.click();
    expect(onCitationClick).toHaveBeenCalledWith(citation);
  });

  it("renders a marker whose citation has not streamed in yet as inert", () => {
    render(<AiMarkdown content="Điểm phù hợp 84% [2]." citations={[citation]} />);

    expect(screen.queryByRole("button", { name: /Nguồn 2/ })).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("leaves an unterminated bold marker as literal text mid-stream", () => {
    // Every streamed token re-parses the whole answer, so a half-arrived `**`
    // must not swallow the rest of the message.
    const { container } = render(<AiMarkdown content="Điểm mạnh **của bạn" citations={[]} />);

    expect(container.querySelector("strong")).toBeNull();
    expect(screen.getByText(/\*\*của bạn/)).toBeInTheDocument();
  });

  it("closes the bold once the trailing marker arrives", () => {
    render(<AiMarkdown content="Điểm mạnh **của bạn**" citations={[]} />);

    expect(screen.getByText("của bạn").tagName).toBe("STRONG");
  });

  it("groups consecutive bullet lines into one list", () => {
    const { container } = render(
      <AiMarkdown content={"Thiếu:\n- Redis\n- Message queue"} citations={[]} />,
    );

    expect(container.querySelectorAll("ul")).toHaveLength(1);
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("never emits raw HTML from model output", () => {
    // §16.1 — model output is untrusted and must not reach the DOM as markup.
    const { container } = render(
      <AiMarkdown content={'<img src=x onerror="alert(1)">'} citations={[]} />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
  });
});

describe("bullet markers", () => {
  it("nhận cả '-', '•' và '*' làm gạch đầu dòng", () => {
    for (const marker of ["-", "•", "*"]) {
      const { container, unmount } = render(
        <AiMarkdown content={`${marker} một\n${marker} hai`} citations={[]} />,
      );
      expect(container.querySelectorAll("li")).toHaveLength(2);
      unmount();
    }
  });

  it("không nhầm **in đậm** đầu dòng thành gạch đầu dòng", () => {
    const { container } = render(<AiMarkdown content="**Kết luận** là vậy" citations={[]} />);
    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(container.querySelector("strong")?.textContent).toBe("Kết luận");
  });
});
