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

  it("offers deadline tabs with a count per urgency", () => {
    render(<CandidateSavedJobsPage />);

    const tabs = within(screen.getByRole("group", { name: "Lọc theo hạn nộp" }));
    expect(tabs.getByRole("button", { name: /^Tất cả/ })).toHaveTextContent("3");
    expect(tabs.getByRole("button", { name: /^Sắp hết hạn/ })).toHaveTextContent("1");
    expect(tabs.getByRole("button", { name: /^Còn hạn/ })).toHaveTextContent("1");
    expect(tabs.getByRole("button", { name: /^Đã đóng/ })).toHaveTextContent("1");
  });

  it("can sort by what closes first", () => {
    render(<CandidateSavedJobsPage />);

    const options = within(screen.getByLabelText("Sắp xếp việc đã lưu"))
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(options).toContain("Sắp hết hạn trước");
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

  it("offers a closed row no apply button", () => {
    render(<CandidateSavedJobsPage />);

    expect(rowFor("Mobile da dong").getByText("Tin đã đóng")).toBeInTheDocument();
    expect(
      rowFor("Mobile da dong").queryByRole("link", { name: /Xem & ứng tuyển/ }),
    ).not.toBeInTheDocument();
    expect(
      rowFor("Frontend sap het han").getByRole("link", { name: /Xem & ứng tuyển/ }),
    ).toBeInTheDocument();
  });
});
