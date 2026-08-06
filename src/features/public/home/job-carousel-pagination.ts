/**
 * Creates pages that use the available jobs evenly instead of leaving a sparse
 * final carousel page. A fixed slice (for example 6 + 2) is especially jarring
 * on narrow screens because the carousel keeps the height of the fuller page.
 */
export function createBalancedPages<T>(items: readonly T[], preferredPageSize: number): T[][] {
  if (items.length === 0) return [[]];

  const safePageSize = Math.max(1, Math.floor(preferredPageSize));
  // Round to the closest number of pages, resolving an exact half down. This
  // lets 9 items at a two-card preference become 3/2/2/2 rather than
  // 2/2/2/2/1, while still avoiding oversized pages in the general case.
  const pageCount = Math.max(1, Math.floor(items.length / safePageSize + 0.5 - 0.000_001));
  const itemsPerPage = Math.floor(items.length / pageCount);
  const pagesWithOneExtraItem = items.length % pageCount;
  const pages: T[][] = [];
  let offset = 0;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageSize = itemsPerPage + (pageIndex < pagesWithOneExtraItem ? 1 : 0);
    pages.push(items.slice(offset, offset + pageSize));
    offset += pageSize;
  }

  return pages;
}
