"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

import { PublicHeader } from "../public/shared/public-header";

type CandidateShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function CandidateShell({ children }: CandidateShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isCvBuilder = pathname.endsWith("/cv-builder");
  const isProfile = pathname.endsWith("/profile");

  if (isCvBuilder) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div
      className={cn(
        "candidate-workspace min-h-screen text-slate-950",
        isProfile ? "bg-slate-50" : "bg-white",
      )}
    >
      <PublicHeader navigate={(path) => router.push(path)} />

      <main
        className={cn(
          "mx-auto pb-8",
          isProfile
            ? "w-[min(1400px,calc(100vw-32px))] pt-6 md:w-[min(1400px,calc(100vw-60px))] md:pt-8 xl:w-[min(1400px,calc(100vw-96px))]"
            : "w-[min(1280px,calc(100vw-32px))] pt-24 md:w-[min(1280px,calc(100vw-60px))] xl:w-[min(1280px,calc(100vw-96px))]",
        )}
      >
        {children}
      </main>
    </div>
  );
}
