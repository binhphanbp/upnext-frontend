import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes } from "react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  usePathname: () => "/candidate/profile",
  useRouter: () => ({ replace: vi.fn<(path: string) => void>() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn<(path: string) => void>() }),
  useSearchParams: () => new URLSearchParams(),
}));

import * as nextNavigation from "next/navigation";

import { PublicHeader } from "./public-header";

describe("PublicHeader candidate recruiter chat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the dedicated chat portal from the candidate dropdown", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn<(path: string) => void>();
    const push = vi.fn<(path: string) => void>();
    vi.spyOn(nextNavigation, "useRouter").mockReturnValue({ push } as any);

    render(
      <PublicHeader
        navigate={navigate}
        viewer={{
          email: "candidate@upnext.dev",
          initials: "UV",
          name: "Ứng viên UpNext",
          roleLabel: "Ứng viên",
          workspaceHref: "/candidate/profile",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tài khoản" }));
    await user.click(screen.getByRole("menuitem", { name: "Chat với nhà tuyển dụng" }));

    expect(push).toHaveBeenCalledWith("/conversations/chat");
  });

  it("clears the green message dot as soon as the candidate opens chat", async () => {
    const user = userEvent.setup();
    const navigate = vi.fn<(path: string) => void>();
    const push = vi.fn<(path: string) => void>();
    vi.spyOn(nextNavigation, "useRouter").mockReturnValue({ push } as any);

    render(<HeaderWithNewMessage navigate={navigate} />);

    const chatButton = screen.getByRole("button", { name: "Tin nhắn" });
    expect(within(chatButton).getByLabelText("Có tin nhắn mới")).toBeInTheDocument();

    await user.click(chatButton);

    expect(within(chatButton).queryByLabelText("Có tin nhắn mới")).not.toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/conversations/chat");
  });
});

function HeaderWithNewMessage({ navigate }: { navigate: (path: string) => void }) {
  const [hasNewMessage, setHasNewMessage] = useState(true);
  return (
    <PublicHeader
      navigate={navigate}
      viewer={{
        email: "candidate@upnext.dev",
        initials: "UV",
        name: "Ứng viên UpNext",
        roleLabel: "Ứng viên",
        workspaceHref: "/candidate/profile",
      }}
      hasNewRecruiterMessages={hasNewMessage}
      onRecruiterChatViewed={() => setHasNewMessage(false)}
    />
  );
}
