import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders an accessible button", () => {
    render(<Button>Search jobs</Button>);

    expect(screen.getByRole("button", { name: "Search jobs" })).toBeInTheDocument();
  });

  it("can render as a child link", () => {
    render(
      <Button asChild>
        <a href="https://upnext.works/jobs">View jobs</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "View jobs" })).toHaveAttribute(
      "href",
      "https://upnext.works/jobs",
    );
  });
});
