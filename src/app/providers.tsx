"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useEffect } from "react";

import { getQueryClient } from "@/shared/api/query-client";
import { env } from "@/shared/lib/env";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (env.NEXT_PUBLIC_API_MOCKING !== "enabled") {
      return;
    }

    void import("@/mocks/browser").then(({ worker }) =>
      worker.start({
        onUnhandledRequest: "bypass",
      }),
    );
  }, []);

  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
