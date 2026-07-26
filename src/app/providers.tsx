"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useEffect } from "react";

import { getQueryClient } from "@/shared/api/query-client";
import { env } from "@/shared/lib/env";
import { AppToaster } from "@/shared/ui/toast";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function Providers({ children, locale = "vi" }: { children: ReactNode; locale?: string }) {
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
      <TooltipProvider delayDuration={450} skipDelayDuration={200}>
        {children}
      </TooltipProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <AppToaster locale={locale} />
    </QueryClientProvider>
  );
}
