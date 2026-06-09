export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <p className="text-sm font-medium tracking-widest text-emerald-300 uppercase">
          UpNext Frontend
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
          Foundation is ready for product work.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-300">
          Next.js, strict TypeScript, Tailwind CSS, TanStack Query, MSW, Vitest, Playwright, Oxlint,
          Oxfmt, Commitlint, and Lefthook are wired as the frontend baseline.
        </p>
      </div>
    </main>
  );
}
