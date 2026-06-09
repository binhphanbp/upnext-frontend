"use client";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Providers } from "./providers";

function QueryClientProbe() {
  const queryClient = useQueryClient();

  return (
    <output data-testid="query-client-ready">
      {queryClient instanceof QueryClient ? "ready" : "missing"}
    </output>
  );
}

describe("Providers", () => {
  it("provides a TanStack Query client to client components", () => {
    render(
      <Providers>
        <QueryClientProbe />
      </Providers>,
    );

    expect(screen.getByTestId("query-client-ready")).toHaveTextContent("ready");
  });
});
