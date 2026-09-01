import { normalizePublicJob, type PublicJob, type PublicJobWire } from "@/features/public/home/api";
import { apiRequest } from "@/shared/api/http";
import { getOrCreateVisitorKey } from "@/shared/lib/visitor-key";

export type SponsoredPlacement = "SEARCH" | "HOMEPAGE";

export type SponsoredJob = Readonly<{
  job: PublicJob;
  boostType: "FEATURED" | "URGENT";
  /** Opaque, short-lived token proving this card came from a recent
   * `getSponsoredJobs` call -- pass back unchanged to `recordBoostImpression`/
   * `recordBoostClick`. Not a `boostId`: the backend never accepts a bare id
   * here (see `job-boost-delivery.service.ts`). */
  deliveryToken: string;
}>;

type SponsoredJobWire = Readonly<{
  job: PublicJobWire;
  boostType: "FEATURED" | "URGENT";
  deliveryToken: string;
}>;

/** Tối đa 2 tin -- khu "Được tài trợ" riêng biệt, không chèn vào danh sách
 * organic (JOB_BOOST_ROLLOUT_PLAN.md mục 5.2). Không đăng nhập. */
export async function getSponsoredJobs(params: {
  placement: SponsoredPlacement;
  keyword?: string | undefined;
  location?: string | undefined;
}): Promise<SponsoredJob[]> {
  const search = new URLSearchParams({ placement: params.placement });
  if (params.keyword?.trim()) search.set("keyword", params.keyword.trim());
  if (params.location?.trim()) search.set("location", params.location.trim());

  const rows = await apiRequest<SponsoredJobWire[]>(`/public/sponsored-jobs?${search.toString()}`);
  return rows.map((row) => ({ ...row, job: normalizePublicJob(row.job) }));
}

function visitorKeyHeaders() {
  const visitorKey = getOrCreateVisitorKey();
  return visitorKey ? { "x-upnext-visitor-key": visitorKey } : {};
}

export async function recordBoostImpression(deliveryToken: string) {
  await apiRequest<{ recorded: boolean }>("/public/job-boost-deliveries/impression", {
    body: JSON.stringify({ deliveryToken }),
    headers: { "Content-Type": "application/json", ...visitorKeyHeaders() },
    method: "POST",
  });
}

export async function recordBoostClick(deliveryToken: string) {
  await apiRequest<{ recorded: boolean }>("/public/job-boost-deliveries/click", {
    body: JSON.stringify({ deliveryToken }),
    headers: { "Content-Type": "application/json", ...visitorKeyHeaders() },
    method: "POST",
  });
}
