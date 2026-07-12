"use client";

import { usePathname, useRouter } from "@/i18n/navigation";

import { PublicHeader } from "../public/shared/public-header";

type CandidateShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function CandidateShell({ children }: CandidateShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isCvBuilder = pathname.endsWith("/cv-builder");
  if (isCvBuilder) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="candidate-workspace min-h-screen bg-slate-50 text-slate-950">
      <PublicHeader navigate={(path) => router.push(path)} />

      <main className="mx-auto w-[min(1400px,calc(100vw-32px))] pt-6 pb-10 md:w-[min(1400px,calc(100vw-60px))] md:pt-8 md:pb-14 xl:w-[min(1400px,calc(100vw-96px))]">
        {children}
      </main>
    </div>
  );
}
