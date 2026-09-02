/**
 * Creates pages of jobs with at most preferredPageSize items per page
 * (e.g. 6 on desktop for a clean 2x3 grid, 4 on tablet, 2 on mobile).
 */
export function createBalancedPages<T>(items: readonly T[], preferredPageSize: number): T[][] {
  if (items.length === 0) return [[]];

  const safePageSize = Math.max(1, Math.floor(preferredPageSize));
  const pages: T[][] = [];

  for (let offset = 0; offset < items.length; offset += safePageSize) {
    pages.push(items.slice(offset, offset + safePageSize));
  }

  return pages;
}
