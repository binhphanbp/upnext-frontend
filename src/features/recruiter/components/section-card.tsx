import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.05)]",
        className,
      )}
    >
      {children}
    </section>
  );
}
