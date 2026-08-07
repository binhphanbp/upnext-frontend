import { Skeleton } from "@/shared/ui/skeleton";

/** Suspense fallback that holds the same footprint as the real workspace, so the */
/** page does not jump when the client bundle resolves. */
export function AiCopilotPageSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[540px] overflow-hidden rounded-2xl border border-slate-200 bg-white md:h-[calc(100dvh-12.5rem)]">
      <div className="hidden w-[264px] shrink-0 flex-col gap-2 border-r border-slate-200 bg-slate-50/60 p-3 lg:flex">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="mt-2 h-3 w-20 rounded" />
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-11 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-44 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 px-6">
          <Skeleton className="size-14 rounded-2xl" />
          <Skeleton className="h-6 w-64 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
          <div className="mt-4 grid w-full gap-2 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="px-4 pb-6 sm:px-6">
          <Skeleton className="mx-auto h-14 w-full max-w-3xl rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
