"use client";

import { useRouter } from "@/i18n/navigation";

import { PublicHeader } from "../public/shared/public-header";

type CandidateShellProps = Readonly<{
  children: React.ReactNode;
}>;

export function CandidateShell({ children }: CandidateShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <PublicHeader navigate={(path) => router.push(path)} />

      <main className="mx-auto w-[min(1280px,calc(100vw-32px))] pt-24 pb-8 md:w-[min(1280px,calc(100vw-60px))] xl:w-[min(1280px,calc(100vw-96px))]">
        {children}
      </main>
    </div>
  );
}
