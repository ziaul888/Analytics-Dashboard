"use client";

import { FilterX, Search } from "lucide-react";
import { useState } from "react";

import { FilterSelect } from "@/components/shared/filter-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { OrdersQuery } from "@/lib/api/contracts";
import {
  DATE_RANGES,
  ORDER_STATUS_FILTER_OPTIONS,
  type DateRangeKey,
  type OrderStatus,
} from "@/lib/constants";

const SEARCH_DEBOUNCE_MS = 300;

const RANGE_OPTIONS = DATE_RANGES.map((r) => ({ value: r.key, label: r.label }));

interface OrdersFiltersProps {
  filters: OrdersQuery;
  hasActiveFilters: boolean;
  onChange: (patch: Partial<OrdersQuery>) => void;
  onReset: () => void;
}

/**
 * Filter row. Search keeps a local draft so typing is instant and only the
 * debounced value reaches the URL (and therefore the API). Selects write
 * through immediately.
 */
export function OrdersFilters({
  filters,
  hasActiveFilters,
  onChange,
  onReset,
}: OrdersFiltersProps) {
  const [draft, setDraft] = useState(filters.search);
  // The last value *this component* pushed to the URL.
  const [lastCommitted, setLastCommitted] = useState(filters.search);
  // The last prop value seen, to detect changes coming from outside
  // (reset button, back/forward, a pasted link). React's documented
  // "adjust state during render" pattern: runs only when the prop changes.
  const [prevSearch, setPrevSearch] = useState(filters.search);
  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    if (filters.search !== lastCommitted) setDraft(filters.search);
  }

  const [commitSearch, cancelPendingSearch] = useDebouncedCallback(
    (value: string) => {
      setLastCommitted(value);
      onChange({ search: value });
    },
    SEARCH_DEBOUNCE_MS,
  );

  const handleReset = () => {
    cancelPendingSearch();
    setLastCommitted("");
    setDraft("");
    onReset();
  };

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={draft}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            commitSearch(value);
          }}
          placeholder="Search by order ID, customer or email…"
          aria-label="Search orders"
          className="pl-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
        <FilterSelect<OrderStatus | "all">
          label="Filter by status"
          value={filters.status}
          options={ORDER_STATUS_FILTER_OPTIONS}
          onChange={(status) => onChange({ status })}
          className="md:w-40"
        />
        <FilterSelect<DateRangeKey>
          label="Filter by date"
          value={filters.range}
          options={RANGE_OPTIONS}
          onChange={(range) => onChange({ range })}
          className="md:w-40"
        />
        {hasActiveFilters ? (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="col-span-2 md:col-span-1"
          >
            <FilterX data-icon="inline-start" aria-hidden="true" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
