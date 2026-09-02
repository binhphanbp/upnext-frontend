import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useLocale: () => "vi" }));
vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn<(input: unknown) => void>(),
    variables: undefined,
  }),
  useQuery: () => ({ data: [], isError: false, isPending: false }),
  useQueryClient: () => ({
    getQueryData: () => undefined,
    setQueryData: () => undefined,
    invalidateQueries: () => Promise.resolve(),
    cancelQueries: () => Promise.resolve(),
  }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn<(path: string) => void>() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn<(path: string) => void>() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { PublicHeader } from "./public-header";

/** Scoped to the desktop mega-menu nav: the same labels also appear in the compact menu. */
function renderPrimaryNav() {
  render(<PublicHeader navigate={vi.fn<(path: string) => void>()} />);

  return within(screen.getByRole("navigation", { name: "Điều hướng chính" }));
}

describe("PublicHeader primary navigation", () => {
  // The mega menu is a shortcut layer, so a section name has to be a destination of its own.
  it.each([
    ["Việc làm IT", "/jobs"],
    ["Công ty", "/companies"],
    ["Bài viết", "/posts"],
  ])("makes %s a link to %s", (label, href) => {
    const nav = renderPrimaryNav();

    expect(nav.getByRole("link", { name: label })).toHaveAttribute("href", href);
  });

  it("calls the section Công ty rather than Công ty IT", () => {
    const nav = renderPrimaryNav();

    expect(nav.queryByText("Công ty IT")).not.toBeInTheDocument();
  });

  // "Tính năng" has no page of its own yet, so it must not pretend to be a destination.
  it("keeps a section with no landing page as a dropdown trigger", () => {
    const nav = renderPrimaryNav();

    expect(nav.queryByRole("link", { name: "Tính năng" })).not.toBeInTheDocument();
    expect(nav.getByRole("button", { name: "Tính năng" })).toBeInTheDocument();
  });

  it("reports the panel state on the link so the chevron is not a lie", () => {
    const nav = renderPrimaryNav();

    expect(nav.getByRole("link", { name: "Công ty" })).toHaveAttribute("aria-expanded", "false");
  });

  it("gives each Công ty menu entry a distinct destination", () => {
    const nav = renderPrimaryNav();

    const hrefs = ["Đang tuyển nhiều nhất", "Big Tech & tập đoàn", "Công ty product"].map((label) =>
      nav.getByRole("link", { name: new RegExp(label) }).getAttribute("href"),
    );

    expect(hrefs).toEqual([
      "/companies?sort=jobs",
      "/companies?size=over-5000",
      "/companies?type=PRODUCT",
    ]);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  /**
   * Reputation scores sit at 50-55 for 94 of the 100 live companies, so ordering by them is
   * arbitrary. A menu entry must not promise a ranking the data cannot produce.
   */
  it("does not advertise a top-rated shortcut backed by the reputation sort", () => {
    const nav = renderPrimaryNav();

    expect(nav.queryByText(/đánh giá cao/i)).not.toBeInTheDocument();
    const reputationLinks = nav
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.includes("sort=reputation"));
    expect(reputationLinks).toEqual([]);
  });
});
