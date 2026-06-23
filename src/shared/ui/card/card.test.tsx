import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

describe("Card", () => {
  it("renders structured card content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Recruiter dashboard</CardTitle>
          <CardDescription>Pipeline and candidate overview</CardDescription>
        </CardHeader>
        <CardContent>Ready for shadcn primitives.</CardContent>
      </Card>,
    );

    expect(screen.getByText("Recruiter dashboard")).toBeInTheDocument();
    expect(screen.getByText("Ready for shadcn primitives.")).toBeInTheDocument();
  });
});
