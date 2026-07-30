import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicCompany } from "@/features/public/home/api";

/**
 * The grid only exists after the companies query resolves, which rules out both available
 * end-to-end checks: the server render ships the pending state, and the in-app browser pane never
 * hydrates. Rendering here with the query stubbed is what actually proves the card markup.
 */
const toggleFollowCompany = vi.fn<(companyId: string, callbacks?: unknown) => boolean>(() => true);
const followedCompanyIds: string[] = [];

vi.mock("next-intl", () => ({ useLocale: () => "vi" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn<(path: string) => void>() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
  usePathname: () => "/companies",
  useRouter: () => ({ push: vi.fn<(path: string) => void>(), replace: vi.fn() }),
}));
vi.mock("@/features/candidate/company-follows", () => ({
  useCandidateCompanyFollows: () => ({
    error: null,
    followedCompanyIds,
    isAuthenticated: true,
    isPending: () => false,
    isSessionResolved: true,
    setCompanyFollowing: vi.fn(),
    toggleFollowCompany,
  }),
}));

const companies: PublicCompany[] = [
  {
    id: "c1",
    name: "Tiki Group",
    slug: "tiki-group",
    type: "PRODUCT",
    activeJobsCount: 3,
    address: "50/20 Street 45, An Hoi Tay Ward, Ho Chi Minh City, Vietnam",
    companySize: "10000+",
    reputationScore: "55",
    verificationStatus: "VERIFIED",
    description: "Nền tảng thương mại điện tử.",
  },
  {
    id: "c2",
    name: "FPT Software",
    slug: "fpt-software",
    type: "OUTSOURCING",
    activeJobsCount: 7,
    address: "FPT Cau Giay Building, Duy Tan Street, Cau Giay Ward, Hanoi, Vietnam",
    companySize: "501-1000",
    reputationScore: "90",
    verificationStatus: "VERIFIED",
    description: "Công ty xuất khẩu phần mềm.",
  },
  {
    id: "c3",
    name: "Chua Cham Diem",
    slug: "chua-cham-diem",
    type: "OTHER",
    activeJobsCount: 1,
    address: "1 Some Street, Gia Lai Province, Vietnam",
    companySize: null,
    reputationScore: null,
    verificationStatus: "VERIFIED",
  },
];

// The header's jobs mega menu shares this hook and expects an array, so the stub answers by key.
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => ({
    data: queryKey.includes("public-companies")
      ? {
          items: companies,
          meta: { total: companies.length, page: 1, limit: 100, totalPages: 1 },
        }
      : [],
    isError: false,
    isPending: false,
  }),
}));

import { PublicCompaniesListPage } from "./components/companies-list-page";

/** Scoped to the results grid: the header mega menu contributes its own lists and links. */
function renderPage() {
  render(<PublicCompaniesListPage navigate={vi.fn<(path: string) => void>()} />);
  return within(screen.getByRole("list", { name: "Danh sách công ty" }));
}

function renderResults() {
  return within(screen.getByRole("list", { name: "Danh sách công ty" }));
}

function cardFor(name: string) {
  return within(renderResults().getByRole("link", { name }).closest("article")!);
}

beforeEach(() => {
  toggleFollowCompany.mockClear();
});

describe("PublicCompaniesListPage", () => {
  it("renders one card per company", () => {
    expect(renderPage().getAllByRole("listitem")).toHaveLength(3);
  });

  // The API stores administrative units in English; a Vietnamese page must not echo that.
  it("shows Vietnamese city names rather than the raw English ones", () => {
    renderPage();

    expect(cardFor("Tiki Group").getByText("TP. Hồ Chí Minh")).toBeInTheDocument();
    expect(cardFor("FPT Software").getByText("Hà Nội")).toBeInTheDocument();
    const results = renderResults();
    expect(results.queryByText("Ho Chi Minh City")).not.toBeInTheDocument();
    expect(results.queryByText("Hanoi")).not.toBeInTheDocument();
  });

  it("offers the disjoint headcount bands, not the API's overlapping ones", () => {
    renderPage();

    const sizeSelect = screen.getByLabelText("Quy mô");
    const options = within(sizeSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);

    // "501-1000" and "10000+" fold into the two bands below; neither raw band is offered.
    expect(options).toEqual(["Tất cả", "Dưới 1.000 nhân sự (1)", "Trên 5.000 nhân sự (1)"]);
  });

  it("leads the location filter with the busiest city", () => {
    renderPage();

    const options = within(screen.getByLabelText("Địa điểm"))
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(options[0]).toBe("Tất cả");
    // All three cities hold one company here, so ties fall back to a stable name order.
    expect(options).toHaveLength(4);
    expect(options).toContain("TP. Hồ Chí Minh (1)");
    expect(options).toContain("Gia Lai (1)");
  });

  it("shows the reputation score with its tier", () => {
    renderPage();

    expect(cardFor("FPT Software").getByText("Uy tín 90/100 · Xuất sắc")).toBeInTheDocument();
    // 50 and 55 must read as one tier, so a five-point gap is not presented as a ranking.
    expect(cardFor("Tiki Group").getByText("Uy tín 55/100 · Khá")).toBeInTheDocument();
  });

  /** A bar was tried first and dominated the card; reputation is supporting detail, not the point. */
  it("keeps reputation as one line beside the other company facts", () => {
    renderPage();

    const card = cardFor("Tiki Group");
    expect(card.queryByRole("meter")).not.toBeInTheDocument();
    expect(card.queryByRole("progressbar")).not.toBeInTheDocument();

    const facts = card.getByText("Uy tín 55/100 · Khá").closest("dl");
    expect(facts).not.toBeNull();
    // The same list already holds the city, the headcount and the open-role count.
    expect(within(facts!).getByText("TP. Hồ Chí Minh")).toBeInTheDocument();
    expect(within(facts!).getByText("3 vị trí đang mở")).toBeInTheDocument();
  });

  it("says a company is unscored instead of drawing it as a zero", () => {
    renderPage();

    const card = cardFor("Chua Cham Diem");
    expect(card.getByText("Chưa có điểm uy tín")).toBeInTheDocument();
    expect(card.queryByText(/0\/100/)).not.toBeInTheDocument();
  });

  /**
   * Both actions were outlined before, so neither read as the main one. Opening the company is what
   * the card is for; following is the optional extra and must stay visually quieter.
   */
  it("gives the two card actions a primary and a secondary weight", () => {
    renderPage();

    const card = cardFor("Tiki Group");
    const view = card.getByRole("link", { name: /Xem công ty: Tiki Group/ });
    const follow = card.getByRole("button", { name: "Theo dõi Tiki Group" });

    // Primary carries the filled brand background; secondary stays on white.
    expect(view.className).toContain("bg-emerald-600");
    expect(view.className).toContain("text-white");
    expect(follow.className).toContain("bg-white");
    expect(follow.className).not.toContain("bg-emerald-600");
  });

  // Following from the detail page only would cost a page load per company.
  it("lets a company be followed straight from the card", () => {
    renderPage();

    const follow = cardFor("Tiki Group").getByRole("button", { name: "Theo dõi Tiki Group" });
    expect(follow).toHaveAttribute("aria-pressed", "false");

    follow.click();
    expect(toggleFollowCompany).toHaveBeenCalledWith("c1", expect.anything());
  });

  it("defaults to the most-hiring order rather than the reputation order", () => {
    renderPage();

    expect(screen.getByLabelText("Sắp xếp")).toHaveValue("jobs");
    const names = renderResults()
      .getAllByRole("listitem")
      .map((item) => item.querySelector("h2")?.textContent);
    expect(names[0]).toBe("FPT Software");
  });
});
