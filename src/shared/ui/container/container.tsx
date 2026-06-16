import type { HTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-12 sm:py-16 lg:py-20", className)} {...props} />;
}
