import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/vi.json";
import type { CandidateKnowledgeSource } from "../api/conversations-api";

const { getCandidateKnowledgeSource } = vi.hoisted(() => ({
  getCandidateKnowledgeSource: vi.fn<(documentId: string) => Promise<CandidateKnowledgeSource>>(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../api/conversations-api", () => ({ getCandidateKnowledgeSource }));

import { CandidateKnowledgeSourcePage } from "./candidate-knowledge-source-page";

describe("CandidateKnowledgeSourcePage", () => {
  beforeEach(() => {
    getCandidateKnowledgeSource.mockReset();
  });

  it("renders the reviewed source body and immutable version from an authorised citation", async () => {
    getCandidateKnowledgeSource.mockResolvedValue({
      id: "document-1",
      locale: "vi",
      title: "UpNext: chuẩn bị hồ sơ",
      sourceVersion: "2026-09-03",
      effectiveAt: "2026-09-03T00:00:00.000Z",
      reviewAt: "2026-12-03T00:00:00.000Z",
      updatedAt: "2026-09-03T00:00:00.000Z",
      content: "Dùng thông tin trung thực.\n\nKhông đưa mã OTP vào CV.",
    });

    render(
      <NextIntlClientProvider locale="vi" messages={messages}>
        <CandidateKnowledgeSourcePage documentId="document-1" />
      </NextIntlClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "UpNext: chuẩn bị hồ sơ" })).toBeVisible();
    expect(screen.getByText("Phiên bản 2026-09-03")).toBeVisible();
    expect(screen.getByText("Dùng thông tin trung thực.")).toBeVisible();
    expect(screen.getByText("Không đưa mã OTP vào CV.")).toBeVisible();
    expect(getCandidateKnowledgeSource).toHaveBeenCalledWith("document-1");
  });
});
