"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { FilterSelect } from "@/components/shared/filter-select";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { getPaginationItems } from "@/lib/pagination";

const PAGE_SIZE_SELECT_OPTIONS = PAGE_SIZE_OPTIONS.map((n) => ({
  value: String(n),
  label: `${n} per page`,
}));

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function OrdersPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: OrdersPaginationProps) {
  // Derived list of page buttons; only recomputed when the inputs change.
  const items = useMemo(() => getPaginationItems(page, totalPages), [page, totalPages]);

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground tabular-nums">
          {formatNumber(from)}–{formatNumber(to)}
        </span>{" "}
        of <span className="font-medium text-foreground tabular-nums">{formatNumber(total)}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Rows per page"
          size="sm"
          value={String(pageSize)}
          options={PAGE_SIZE_SELECT_OPTIONS}
          onChange={(value) => onPageSizeChange(Number(value))}
          className="w-32"
        />
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          {items.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="hidden px-1 text-sm text-muted-foreground sm:inline"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "ghost"}
                size="icon-sm"
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
                className="hidden tabular-nums sm:inline-flex"
              >
                {item}
              </Button>
            ),
          )}
          <span className="px-1 text-sm text-muted-foreground tabular-nums sm:hidden">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
