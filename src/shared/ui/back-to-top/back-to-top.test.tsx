import { render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import messages from "../../../../messages/vi.json";
import { BackToTop } from "./back-to-top";

function renderWithIntl() {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <BackToTop />
    </NextIntlClientProvider>,
  );
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, writable: true, configurable: true });
}

describe("BackToTop", () => {
  beforeEach(() => {
    setScrollY(0);
    window.matchMedia =
      window.matchMedia ??
      vi.fn<(query: string) => MediaQueryList>().mockReturnValue({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn<() => void>(),
        removeListener: vi.fn<() => void>(),
        addEventListener: vi.fn<() => void>(),
        removeEventListener: vi.fn<() => void>(),
        dispatchEvent: vi.fn<() => boolean>(),
      } as MediaQueryList);
  });

  afterEach(() => {
    setScrollY(0);
  });

  it("stays hidden and unreachable by keyboard before the scroll threshold", () => {
    renderWithIntl();

    const button = screen.getByRole("button", { name: "Lên đầu trang" });
    expect(button.className).toContain("opacity-0");
    expect(button).toHaveAttribute("tabindex", "-1");
  });

  it("becomes visible and focusable once the page scrolls past the threshold", async () => {
    renderWithIntl();

    setScrollY(500);
    window.dispatchEvent(new Event("scroll"));

    const button = screen.getByRole("button", { name: "Lên đầu trang" });
    await waitFor(() => expect(button.className).toContain("opacity-100"));
    expect(button).toHaveAttribute("tabindex", "0");
  });

  it("scrolls back to the top on click", async () => {
    renderWithIntl();
    setScrollY(500);
    window.dispatchEvent(new Event("scroll"));

    const scrollTo = vi.fn<(options?: ScrollToOptions) => void>();
    window.scrollTo = scrollTo;

    const button = await screen.findByRole("button", { name: "Lên đầu trang" });
    button.click();

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
  });
});
