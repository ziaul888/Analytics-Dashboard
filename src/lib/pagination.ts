/**
 * Compute the page buttons to show: always the first and last page, the
 * current page with one neighbour on each side, and ellipses for the gaps.
 * e.g. page 6 of 12 -> [1, "…", 5, 6, 7, "…", 12]
 */
export type PaginationItem = number | "ellipsis";

export function getPaginationItems(
  page: number,
  totalPages: number,
  siblings = 1,
): PaginationItem[] {
  if (totalPages <= 1) return [1];
  const maxVisible = siblings * 2 + 5; // first, last, current ± siblings, 2 ellipses
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, Math.min(page - siblings, totalPages - siblings * 2 - 2));
  const end = Math.min(totalPages - 1, Math.max(page + siblings, siblings * 2 + 3));

  const items: PaginationItem[] = [1];
  if (start > 2) items.push("ellipsis");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}
