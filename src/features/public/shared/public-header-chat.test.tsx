import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes } from "react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({ useLocale: () => "vi" }));
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

import { PublicHeader } from "./public-header";

describe("PublicHeader candidate recruiter chat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the dedicated chat portal in a new tab from the candidate dropdown", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    render(
      <PublicHeader
        navigate={vi.fn<(path: string) => void>()}
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

    expect(open).toHaveBeenCalledWith("/conversations/chat", "_blank", "noopener,noreferrer");
  });

  it("clears the green message dot as soon as the candidate opens chat", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    render(<HeaderWithNewMessage />);

    const chatButton = screen.getByRole("button", { name: "Tin nhắn" });
    expect(within(chatButton).getByLabelText("Có tin nhắn mới")).toBeInTheDocument();

    await user.click(chatButton);

    expect(within(chatButton).queryByLabelText("Có tin nhắn mới")).not.toBeInTheDocument();
    expect(open).toHaveBeenCalledWith("/conversations/chat", "_blank", "noopener,noreferrer");
  });
});

function HeaderWithNewMessage() {
  const [hasNewMessage, setHasNewMessage] = useState(true);
  return (
    <PublicHeader
      navigate={vi.fn<(path: string) => void>()}
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
