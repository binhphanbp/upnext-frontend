import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Breadcrumb } from "./breadcrumb";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe("Breadcrumb", () => {
  it("renders breadcrumb items", () => {
    const items = [
      { label: "Trang chủ", href: "/" },
      { label: "Việc làm", href: "/jobs" },
      { label: "Chi tiết công việc" },
    ];

    render(<Breadcrumb items={items} />);

    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Việc làm")).toBeInTheDocument();
    expect(screen.getByText("Chi tiết công việc")).toBeInTheDocument();
  });
});
