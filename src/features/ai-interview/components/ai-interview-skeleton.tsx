import { Skeleton } from "@/shared/ui/skeleton";

/** Mirrors the setup layout so the first paint does not reflow into it. */
export function AiInterviewSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        </div>
        {[220, 180, 160].map((height) => (
          <Skeleton key={height} className="w-full rounded-2xl" style={{ height }} />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}
