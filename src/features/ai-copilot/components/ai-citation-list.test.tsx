import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

// `createNavigation` imports Next's client navigation module, which Vitest does
// not resolve in this isolated component test. The citation component only
// needs the link rendering contract, so use a small faithful anchor boundary.
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

import messages from "../../../../messages/vi.json";
import { AiCitationList } from "./ai-citation-list";

describe("AiCitationList", () => {
  it("shows the immutable reviewed-source version beside a knowledge citation", () => {
    render(
      <NextIntlClientProvider locale="vi" messages={messages}>
        <AiCitationList
          citations={[
            {
              id: "knowledge:chunk-1",
              index: 1,
              sourceType: "POLICY",
              sourceId: "document-1",
              title: "UpNext: chuẩn bị hồ sơ",
              excerpt: "Chỉ sử dụng thông tin trung thực trong CV.",
              sourceVersion: "2026-09-03",
              href: "/candidate/ai?guide=cv-ho-so&locale=vi",
            },
          ]}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Phiên bản 2026-09-03")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mở nguồn/ })).toHaveAttribute(
      "href",
      "/candidate/ai?guide=cv-ho-so&locale=vi",
    );
  });
});
