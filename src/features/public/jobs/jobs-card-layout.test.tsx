import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import type { PublicJob } from "@/features/public/home/api";

/**
 * Card structure can only be checked here: the server render ships the pending skeletons because the
 * jobs query resolves on the client, and the in-app browser pane never hydrates.
 */
vi.mock("next-intl", () => ({ useLocale: () => "vi" }));
/** Set per test so the same card can be inspected in both layouts. */
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  // The public header reaches for the native router to open the recruiter chat portal.
  useRouter: () => ({ push: vi.fn<(path: string) => void>() }),
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    prefetch: _prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a {...props}>{children}</a>
  ),
  usePathname: () => "/jobs",
  useRouter: () => ({ push: vi.fn<(path: string) => void>(), replace: vi.fn<() => void>() }),
}));
vi.mock("@/features/candidate/session", () => ({
  clearCandidateSession: vi.fn<() => void>(),
  getCandidateSession: () => null,
}));
vi.mock("@/features/candidate/saved-jobs", () => ({
  useCandidateSavedJobs: () => ({
    isPending: () => false,
    isSessionResolved: true,
    savedJobIds: [] as string[],
    toggleSaveJob: () => true,
  }),
}));
vi.mock("@/shared/api/http", () => ({
  ApiError: class extends Error {},
  apiRequest: vi.fn<() => Promise<unknown>>().mockResolvedValue({ items: [] }),
}));

const publishedAt = "2026-07-20T00:00:00.000Z";

/**
 * Deliberately awkward content, matching what the live board actually serves: a title that needs
 * two rows in a grid column, a long city name, and more skills than a narrow card can show.
 */
const apiJob = {
  id: "job-1",
  title: "Technical Project Manager / Scrum Master",
  description: "",
  requirements: null,
  benefits: null,
  salaryMin: 45_000_000,
  salaryMax: 80_000_000,
  salaryCurrency: "VND",
  salaryIsNegotiable: false,
  salaryIsVisible: true,
  publishedAt,
  expiredAt: null,
  createdAt: publishedAt,
  company: { id: "c1", name: "DEK Technologies Vietnam", verificationStatus: "VERIFIED" },
  jobPostLocations: [{ jobLocation: { city: "Thành phố Hồ Chí Minh", workingModel: "hybrid" } }],
  jobPostSkills: [
    { skill: { id: "s1", name: "Docker" } },
    { skill: { id: "s2", name: "Kubernetes" } },
    { skill: { id: "s3", name: "AWS" } },
    { skill: { id: "s4", name: "Terraform" } },
    { skill: { id: "s5", name: "Jenkins" } },
  ],
} as unknown as PublicJob;

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    isPending: false,
    mutate: vi.fn<(input: unknown) => void>(),
    variables: undefined,
  }),
  useQueryClient: () => ({
    getQueryData: () => undefined,
    setQueryData: () => undefined,
    invalidateQueries: () => Promise.resolve(),
    cancelQueries: () => Promise.resolve(),
  }),
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => ({
    data: queryKey.includes("public-jobs") ? [apiJob] : [],
    isError: false,
    isPending: false,
    refetch: vi.fn<() => void>(),
  }),
}));

import { PublicJobsPage } from "./components/jobs-page";

function renderJobs(view: "list" | "grid" = "list") {
  searchParams = new URLSearchParams(view === "grid" ? "view=grid" : "");
  render(
    <PublicJobsPage navigate={vi.fn<(path: string) => void>()} replace={vi.fn<() => void>()} />,
  );
  return screen.getByRole("button", { name: "Lưu tin" });
}

/** The card is the nearest positioned ancestor of the corner bookmark. */
function cardFor(save: HTMLElement) {
  const card = save.closest<HTMLElement>("div.relative");
  expect(card).not.toBeNull();
  return card!;
}

describe("job card layout", () => {
  /**
   * Saving is a bookmark on the card, not a step in applying. Sharing a row with Chi tiết and
   * Ứng tuyển made three controls compete and took width from the primary action.
   */
  it("keeps the save button out of the apply action row", () => {
    const save = renderJobs();
    const apply = screen.getByRole("button", { name: "Ứng tuyển" });

    expect(save.parentElement).not.toBe(apply.parentElement);
    expect(within(apply.parentElement!).queryByRole("button", { name: "Lưu tin" })).toBeNull();
  });

  it("pins the save button to the card corner", () => {
    const save = renderJobs();

    expect(save.className).toContain("absolute");
    expect(save.className).toContain("top-3");
    expect(save.className).toContain("right-3");

    // Anchored to the card, so it lands in that card's corner rather than the page's.
    const card = save.closest<HTMLElement>("div.relative");
    expect(card).not.toBeNull();
    expect(within(card!).getByRole("button", { name: "Ứng tuyển" })).toBeInTheDocument();
  });

  /** A long title must not run underneath the corner button. */
  it("reserves room beside the title for the corner button", () => {
    const save = renderJobs();
    // Exact name: the logo button's aria-label also mentions the title.
    const title = screen.getByRole("button", { name: apiJob.title });
    const body = title.closest<HTMLElement>("div.flex-1");

    expect(body).not.toBeNull();
    expect(body!.className).toContain("pr-10");
    expect(save.closest("div.relative")).toContainElement(body);
  });

  /**
   * The clamp used to sit on the <h3>, whose only child is a <button> — so it clamped that button's
   * single line rather than the text inside it, and long titles still ran to two rows.
   */
  it("clamps the title on the element that actually wraps the text", () => {
    renderJobs("grid");
    const title = screen.getByRole("button", { name: apiJob.title });

    expect(title.closest("h3")!.className).not.toContain("line-clamp");
    const clamped = within(title).getByText(apiJob.title);
    expect(clamped.className).toContain("line-clamp-1");
  });

  it("gives the full title as a tooltip, since one line cannot show it all", () => {
    renderJobs("grid");

    expect(screen.getByRole("button", { name: apiJob.title })).toHaveAttribute(
      "title",
      apiJob.title,
    );
  });

  /** Skills wrapped onto a second row in the grid, which pushed the footer down unevenly. */
  it("keeps skills on one row and moves the remainder into the counter", () => {
    const save = renderJobs("grid");
    const card = cardFor(save);

    // Two of five fit the grid column; the other three are counted, not wrapped.
    expect(within(card).getByText("Docker")).toBeInTheDocument();
    expect(within(card).getByText("Kubernetes")).toBeInTheDocument();
    expect(within(card).queryByText("AWS")).toBeNull();

    const counter = within(card).getByText("+3");
    expect(counter).toHaveAttribute("title", "AWS, Terraform, Jenkins");
    // The row cannot wrap, so a tag can never drop below its neighbours.
    expect(counter.parentElement!.className).toContain("overflow-hidden");
    expect(counter.parentElement!.className).not.toContain("flex-wrap");
  });

  it("shows more skills in the list layout, where the row is wider", () => {
    const save = renderJobs("list");
    const card = cardFor(save);

    expect(within(card).getByText("AWS")).toBeInTheDocument();
    expect(within(card).getByText("+2")).toBeInTheDocument();
  });

  /** In the grid the pair used to shrink to its labels, leaving a dead strip beside them. */
  it("stretches both actions across the grid card", () => {
    renderJobs("grid");

    for (const name of ["Chi tiết", "Ứng tuyển"]) {
      const button = screen.getByRole("button", { name });
      expect(button.className).toContain("flex-1");
      expect(button.className).not.toContain("sm:flex-initial");
    }
  });

  it("lets the actions hug their labels in the list layout", () => {
    renderJobs("list");

    expect(screen.getByRole("button", { name: "Ứng tuyển" }).className).toContain(
      "sm:flex-initial",
    );
  });

  /** A long city name must truncate rather than push the posted date onto a second line. */
  it("keeps the location and date on one line", () => {
    const save = renderJobs("grid");
    const card = cardFor(save);
    const location = within(card).getByText("Thành phố Hồ Chí Minh");

    expect(location.className).toContain("truncate");
    const metaRow = location.closest("div.flex")!;
    expect(metaRow.className).not.toContain("flex-wrap");
  });

  /**
   * Status markers ("Tuyển gấp", "Nổi bật") used to trail the title inline, which is what forced a
   * second row in a narrow column. The title button now carries the title and nothing else, so no
   * badge can lengthen it.
   */
  it("leaves the title button holding only the title", () => {
    const save = renderJobs("grid");
    const title = screen.getByRole("button", { name: apiJob.title });

    expect(title.textContent).toBe(apiJob.title);
    expect(cardFor(save)).toContainElement(title);
  });
});
