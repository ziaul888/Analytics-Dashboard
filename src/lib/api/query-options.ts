/**
 * React Query keys and options for every client-side API call.
 *
 * Keys are built from the *normalised* query (defaults stripped, same
 * serialisation the URL uses), so the Server Component that prefetches
 * `/orders?status=refunded` and the Client Component that reads the same URL
 * produce an identical key and the hydrated cache is hit, not refetched.
 *
 * `queryOptions()` keeps key + fetcher + per-query settings together and
 * fully typed, so call sites are just `useQuery(ordersListOptions(filters))`.
 */

import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { type OrdersQuery, ordersQueryToSearchParams } from "./contracts";
import { fetchOrder, fetchOrders } from "./orders";

const ORDER_DETAIL_STALE_TIME_MS = 5 * 60_000;

function normaliseOrdersQuery(query: OrdersQuery): Record<string, string> {
  return Object.fromEntries(ordersQueryToSearchParams(query));
}

export const queryKeys = {
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    list: (query: OrdersQuery) =>
      [...queryKeys.orders.lists(), normaliseOrdersQuery(query)] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
};

/** Paginated, filtered order list. Keeps the previous page on screen while the next loads. */
export function ordersListOptions(query: OrdersQuery) {
  return queryOptions({
    queryKey: queryKeys.orders.list(query),
    queryFn: ({ signal }) => fetchOrders(query, signal),
    placeholderData: keepPreviousData,
  });
}

/** Single order with line items. Orders don't change, so cache them longer. */
export function orderDetailOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.orders.detail(id),
    queryFn: ({ signal }) => fetchOrder(id, signal),
    staleTime: ORDER_DETAIL_STALE_TIME_MS,
  });
}
