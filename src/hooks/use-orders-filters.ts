"use client";

/**
 * Filter/UI state for the orders page, stored in the URL.
 *
 * Why the URL rather than useState/context:
 *  - shareable + bookmarkable ("send me the link to refunded orders in July")
 *  - survives refresh and works with back/forward
 *  - one source of truth: the same `ordersQuerySchema` that validates API
 *    requests parses the URL, so UI state and API params can't drift.
 *
 * Updates use `window.history.replaceState`, which Next.js integrates with
 * `useSearchParams`; unlike `router.replace` it does not trigger a server
 * round-trip, which is exactly right for client-fetched data.
 */

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  ORDERS_QUERY_KEYS,
  ordersQuerySchema,
  ordersQueryToSearchParams,
  parseLenient,
  type OrdersQuery,
} from "@/lib/api/contracts";
import { DEFAULT_ORDERS_RANGE, ORDER_PARAM } from "@/lib/constants";

export interface UseOrdersFiltersResult {
  filters: OrdersQuery;
  hasActiveFilters: boolean;
  setFilters: (patch: Partial<OrdersQuery>) => void;
  resetFilters: () => void;
  selectedOrderId: string | null;
  setSelectedOrder: (id: string | null) => void;
}

export function useOrdersFilters(): UseOrdersFiltersResult {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Parsing + default-filling runs only when the URL actually changes.
  const filters = useMemo(
    () => parseLenient(ordersQuerySchema, new URLSearchParams(searchParams)),
    [searchParams],
  );
  const selectedOrderId = searchParams.get(ORDER_PARAM);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams);
      mutate(params);
      const qs = params.toString();
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [searchParams, pathname],
  );

  const setFilters = useCallback(
    (patch: Partial<OrdersQuery>) => {
      replaceParams((params) => {
        const next: OrdersQuery = { ...filters, ...patch };
        // Changing what is being filtered invalidates the current page number.
        const changesFilter = Object.keys(patch).some((k) => k !== "page");
        if (changesFilter && patch.page === undefined) next.page = 1;
        for (const key of ORDERS_QUERY_KEYS) params.delete(key);
        ordersQueryToSearchParams(next).forEach((value, key) =>
          params.set(key, value),
        );
      });
    },
    [filters, replaceParams],
  );

  const resetFilters = useCallback(() => {
    replaceParams((params) => {
      for (const key of ORDERS_QUERY_KEYS) {
        if (key !== "simulate") params.delete(key);
      }
    });
  }, [replaceParams]);

  const setSelectedOrder = useCallback(
    (id: string | null) => {
      replaceParams((params) => {
        if (id) params.set(ORDER_PARAM, id);
        else params.delete(ORDER_PARAM);
      });
    },
    [replaceParams],
  );

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.range !== DEFAULT_ORDERS_RANGE;

  return {
    filters,
    hasActiveFilters,
    setFilters,
    resetFilters,
    selectedOrderId,
    setSelectedOrder,
  };
}
