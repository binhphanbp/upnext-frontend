import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import type { SavedJobApi } from "@/features/candidate/api/profile";

/**
 * The list only exists behind a candidate session, so neither the server render nor the in-app
 * browser pane can reach it. Rendering here with the session and queries stubbed is what actually
 * proves the deadline treatment.
 */
const messages = (await import("../../../../messages/vi.json")).default;

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => "vi",
    useTranslations: (namespace: string) => {
      const scope = namespace
        .split(".")
        .reduce<Record<string, unknown>>(
          (node, key) => (node?.[key] ?? {}) as Record<string, unknown>,
          messages as unknown as Record<string, unknown>,
        );

      return (key: string, values?: Record<string, unknown>) => {
        const raw = key
          .split(".")
          .reduce<unknown>(
            (node, part) => (node as Record<string, unknown> | undefined)?.[part],
            scope,
          );
        if (typeof raw !== "string") return key;
        return raw.replace(/\{(\w+)\}/g, (_match, name: string) => String(values?.[name] ?? ""));
      };
    },
  };
});

const searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn<(path: string) => void>() }),
}));
vi.mock("@/features/candidate/profile/use-candidate-profile", () => ({
  useCandidateProfileWorkspace: () => ({
    isSessionResolved: true,
    session: { accessToken: "token", user: { id: "candidate" } },
  }),
}));

/** Deadlines are relative, so the rows are built from a fixed offset rather than literal dates. */
const dayInMs = 86_400_000;
function savedJob(id: string, title: string, daysToDeadline: number | null): SavedJobApi {
  return {
    candidateProfileId: "candidate-profile",
    createdAt: "2026-07-01T00:00:00.000Z",
    id,
    jobPost: {
      company: { id: `company-${id}`, name: `Company ${id}` },
      description: "",
      expiredAt:
        daysToDeadline === null
          ? null
          : new Date(Date.now() + daysToDeadline * dayInMs).toISOString(),
      id: `job-${id}`,
      publishedAt: "2026-07-01T00:00:00.000Z",
      salaryCurrency: "VND",
      salaryIsNegotiable: false,
      salaryIsVisible: false,
      salaryMax: null,
      salaryMin: null,
      slug: `job-${id}`,
      status: "PUBLISHED",
      title,
    },
    jobPostId: `job-${id}`,
  };
}

/**
 * Half-day offsets on purpose. The countdown floors the hours left so it never claims more time than
 * a posting really has, which means a flat "2 days" would land a hair under two days by render time
 * and read as 1.
 */
const savedJobs = [
  savedJob("soon", "Frontend sap het han", 2.5),
  savedJob("open", "Backend con han", 30.5),
  savedJob("closed", "Mobile da dong", -3),
];

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn<(input: unknown) => void>(),
    variables: undefined,
  }),
  useQueryClient: () => ({
    cancelQueries: vi.fn<() => Promise<void>>(),
    getQueryData: vi.fn<() => unknown>(),
    invalidateQueries: vi.fn<() => Promise<void>>(),
    setQueryData: vi.fn<() => void>(),
  }),
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const isSavedJobs = queryKey.includes("candidate-saved-jobs");
    return {
      data: isSavedJobs ? savedJobs : [],
      error: null,
      isError: false,
      isLoading: false,
      isSuccess: true,
      refetch: vi.fn<() => void>(),
    };
  },
}));

import { CandidateSavedJobsPage } from "./saved-jobs-page";

function rowFor(title: string) {
  return within(screen.getByRole("link", { name: title }).closest("article")!);
}

describe("CandidateSavedJobsPage", () => {
  /**
   * The page description promises applying before a posting expires, so the deadline has to be on
   * the row. Previously only the save date was shown, which cannot drive that decision.
   */
  it("shows the time left to apply on every row", () => {
    render(<CandidateSavedJobsPage />);

    expect(rowFor("Frontend sap het han").getByText("Còn 2 ngày để ứng tuyển")).toBeInTheDocument();
    expect(rowFor("Mobile da dong").getByText("Đã hết hạn nộp")).toBeInTheDocument();
    // Outside the warning window the exact date reads better than a long countdown.
    expect(rowFor("Backend con han").getByText(/^Hạn nộp /)).toBeInTheDocument();
  });

  it("keeps the save date but demotes it below the deadline", () => {
    render(<CandidateSavedJobsPage />);

    const row = rowFor("Frontend sap het han");
    expect(row.getByText(/^Lưu /)).toBeInTheDocument();
    // The urgent deadline is the tinted one; the save date stays plain.
    expect(row.getByText("Còn 2 ngày để ứng tuyển").className).toContain("amber");
    expect(row.getByText(/^Lưu /).className).not.toContain("amber");
  });

  /** Only a genuinely close deadline is tinted, or the colour would stop meaning anything. */
  it("does not flag a deadline that is still far away", () => {
    render(<CandidateSavedJobsPage />);

    expect(rowFor("Backend con han").getByText(/^Hạn nộp /).className).not.toContain("amber");
  });

  /**
   * The tracker groups by status behind tabs because it is a queue you monitor. A shortlist is a
   * working set where every entry is a pending decision, so nothing hides behind a click; sections
   * put what closes first at the top instead. Tabs were also the tracker's signature control, which
   * made two very different pages read as the same one.
   */
  it("groups by urgency in sections rather than hiding entries behind tabs", () => {
    render(<CandidateSavedJobsPage />);

    expect(screen.queryByRole("group", { name: "Lọc theo hạn nộp" })).not.toBeInTheDocument();

    const headings = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(["Sắp hết hạn", "Còn hạn"]);
  });

  it("puts the closing-soon section above the open one", () => {
    render(<CandidateSavedJobsPage />);

    const soon = screen.getByRole("heading", { level: 2, name: "Sắp hết hạn" });
    const open = screen.getByRole("heading", { level: 2, name: "Còn hạn" });

    expect(soon.compareDocumentPosition(open) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /** Closed entries stay removable but must not push live decisions down the page. */
  it("collapses the closed group", () => {
    const { container } = render(<CandidateSavedJobsPage />);

    const details = container.querySelector("details");
    expect(details).not.toBeNull();
    expect(details!.open).toBe(false);
    expect(within(details!).getByText("Đã đóng")).toBeInTheDocument();
    expect(within(details!).getByText("(1)")).toBeInTheDocument();
  });

  it("renders entries as a card grid, not a divided row list", () => {
    const { container } = render(<CandidateSavedJobsPage />);

    // The tracker uses a single bordered container with divide-y rows.
    expect(container.querySelector(".divide-y")).toBeNull();
    expect(container.querySelector("ul.grid")).not.toBeNull();
  });

  it("defaults to closing-soonest and can sort by pay", () => {
    render(<CandidateSavedJobsPage />);

    const sortSelect = screen.getByLabelText("Sắp xếp việc đã lưu");
    expect(sortSelect).toHaveValue("deadline");

    const options = within(sortSelect)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options[0]).toBe("Sắp hết hạn trước");
    expect(options).toContain("Lương cao nhất");
  });

  /**
   * The page used to hand-roll a fixed toast layer at bottom-right while the app-wide sonner toaster
   * sits in the same corner, giving two independent stacks.
   */
  it("does not render a second toast layer of its own", () => {
    const { container } = render(<CandidateSavedJobsPage />);

    expect(container.querySelector(".fixed.bottom-4.right-4")).toBeNull();
    expect(screen.queryByText("Đã bỏ việc làm khỏi shortlist.")).not.toBeInTheDocument();
  });

  it("offers a closed card no apply button", () => {
    render(<CandidateSavedJobsPage />);

    expect(
      rowFor("Mobile da dong").queryByRole("link", { name: /Xem & ứng tuyển/ }),
    ).not.toBeInTheDocument();
    expect(rowFor("Mobile da dong").getByRole("link", { name: "Xem lại tin" })).toBeInTheDocument();
    expect(
      rowFor("Frontend sap het han").getByRole("link", { name: /Xem & ứng tuyển/ }),
    ).toBeInTheDocument();
  });

  /** Every card carries a filled apply button, unlike the tracker's read-only rows. */
  it("gives each open card a primary apply action", () => {
    render(<CandidateSavedJobsPage />);

    const apply = rowFor("Frontend sap het han").getByRole("link", { name: /Xem & ứng tuyển/ });
    expect(apply.className).toContain("w-full");
  });
});
