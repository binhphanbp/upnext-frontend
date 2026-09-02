/**
 * Splices sponsored items into an organic list at fixed, predictable
 * positions -- not randomized and not tied to sort/rank, so a paid slot
 * behaves like any labelled ad placement: same spot regardless of how the
 * surrounding list is sorted or filtered (JOB_BOOST_ROLLOUT_PLAN.md mục 5.2).
 * Capped at 2 sponsored items; one already present organically (by id) is
 * not duplicated -- the sponsored version replaces it. Shared by
 * `jobs-page.tsx` (/jobs results) and `home-page.tsx` ("Việc làm mới nhất").
 */
export function interleaveSponsored<T extends { id: string }>(
  organic: readonly T[],
  sponsored: readonly T[],
  insertAfter: readonly number[] = [3, 7],
): T[] {
  const capped = sponsored.slice(0, 2);
  const sponsoredIds = new Set(capped.map((item) => item.id));
  const organicWithoutDupes = organic.filter((item) => !sponsoredIds.has(item.id));

  const result: T[] = [];
  let nextSponsored = 0;
  organicWithoutDupes.forEach((item, index) => {
    result.push(item);
    const next = capped[nextSponsored];
    if (insertAfter.includes(index + 1) && next) {
      result.push(next);
      nextSponsored++;
    }
  });
  while (nextSponsored < capped.length) {
    const next = capped[nextSponsored];
    if (!next) break;
    result.push(next);
    nextSponsored++;
  }
  return result;
}
