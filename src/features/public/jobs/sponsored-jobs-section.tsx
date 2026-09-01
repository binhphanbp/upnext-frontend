"use client";

import { Buildings, MapPin, Rocket } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { Badge } from "@/shared/ui/badge";

import {
  getSponsoredJobs,
  recordBoostClick,
  type SponsoredJob,
  type SponsoredPlacement,
} from "./sponsored-jobs-api";
import { useBoostImpression } from "./use-boost-impression";

/** How long to wait after the visitor stops typing before asking the sponsored
 * endpoint again -- this hits the network per call, unlike the organic list
 * (already loaded client-side), so it needs its own light debounce. */
const REFETCH_DEBOUNCE_MS = 400;

type SponsoredJobsSectionProps = Readonly<{
  placement: SponsoredPlacement;
  keyword?: string | undefined;
  location?: string | undefined;
  navigate: (path: string) => void;
  /** Outer wrapper class -- the two host pages center content differently
   * (`.jobs-container` on `/jobs`, the already-centered `.marketing-home-content`
   * on the homepage), so this can't be hardcoded to either one. */
  containerClassName?: string | undefined;
}>;

/**
 * "Được tài trợ" -- tối đa 2 tin, section riêng biệt khỏi danh sách organic
 * (JOB_BOOST_ROLLOUT_PLAN.md mục 5.2: không chèn/sắp xếp lại kết quả chính).
 * Dùng ở cả `/jobs` (placement=SEARCH) và trang chủ (placement=HOMEPAGE).
 */
export function SponsoredJobsSection({
  placement,
  keyword,
  location,
  navigate,
  containerClassName,
}: SponsoredJobsSectionProps) {
  const [sponsored, setSponsored] = useState<SponsoredJob[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      void getSponsoredJobs({ placement, keyword, location })
        .then((rows) => {
          if (!cancelled) setSponsored(rows);
        })
        .catch(() => {
          if (!cancelled) setSponsored([]);
        });
    }, REFETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placement, keyword, location]);

  if (sponsored.length === 0) return null;

  return (
    <div className={containerClassName}>
      <div className="mb-3 flex items-center gap-2">
        <Rocket size={16} weight="fill" className="text-indigo-600" />
        <h2 className="text-sm font-bold text-slate-800">Việc làm được tài trợ</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sponsored.map((entry) => (
          <SponsoredJobCard key={entry.job.id} entry={entry} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

function SponsoredJobCard({
  entry,
  navigate,
}: {
  entry: SponsoredJob;
  navigate: (path: string) => void;
}) {
  const { job, boostType, deliveryToken } = entry;
  const impressionRef = useBoostImpression(deliveryToken);

  return (
    <button
      ref={impressionRef}
      type="button"
      onClick={() => {
        void recordBoostClick(deliveryToken).catch(() => {
          // Tracking is best-effort -- never block navigation for it.
        });
        navigate(`/jobs/${job.id}`);
      }}
      className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <Badge tone="premium" className="gap-1">
          <Rocket size={12} weight="fill" />
          {boostType === "URGENT" ? "Tuyển gấp" : "Được tài trợ"}
        </Badge>
      </div>
      <p className="line-clamp-2 text-sm font-bold text-slate-800">{job.title}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Buildings size={13} className="shrink-0" />
        <span className="truncate">{job.company?.name ?? "UpNext Partner"}</span>
      </div>
      {job.jobPostLocations?.[0]?.jobLocation?.city ? (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{job.jobPostLocations[0].jobLocation.city}</span>
        </div>
      ) : null}
    </button>
  );
}
