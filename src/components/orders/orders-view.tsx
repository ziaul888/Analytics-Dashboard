"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageOpen } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useOrdersFilters } from "@/hooks/use-orders-filters";
import type { OrdersQuery } from "@/lib/api/contracts";
import { ordersListOptions } from "@/lib/api/query-options";
import { cn } from "@/lib/utils";
import { OrderDetailsSheet } from "./order-details-sheet";
import { OrdersFilters } from "./orders-filters";
import { OrdersPagination } from "./orders-pagination";
import { OrdersTable } from "./orders-table";
import { OrdersTableSkeleton } from "./orders-table-skeleton";

/**
 * Orders feature root (Client Component).
 *
 * State lives in the URL (`useOrdersFilters`); data comes from the mock API via
 * the service layer (`fetchOrders`) through React Query (`ordersListOptions`),
 * which caches by key, de-duplicates in-flight requests, cancels stale ones via
 * AbortSignal and keeps the previous page visible while the next loads. The
 * first page is already in the cache, hydrated by the Server Component.
 * This component only orchestrates: it decides which of the loading / error /
 * empty / data views to show and wires callbacks.
 */
export function OrdersView() {
  const {
    filters,
    hasActiveFilters,
    setFilters,
    resetFilters,
    selectedOrderId,
    setSelectedOrder,
  } = useOrdersFilters();

  const ordersQuery = useQuery(ordersListOptions(filters));

  // Stable references: these are passed to memoised rows / child components.
  const handleSelect = useCallback(
    (id: string) => setSelectedOrder(id),
    [setSelectedOrder],
  );
  const handleCloseDetails = useCallback(
    () => setSelectedOrder(null),
    [setSelectedOrder],
  );
  const handlePageChange = useCallback(
    (page: number) => setFilters({ page }),
    [setFilters],
  );
  const handlePageSizeChange = useCallback(
    (pageSize: number) => setFilters({ pageSize: pageSize as OrdersQuery["pageSize"] }),
    [setFilters],
  );

  const { data, status, error, isFetching, refetch } = ordersQuery;
  const isEmpty = data !== undefined && data.items.length === 0;

  return (
    <>
      <Card>
        <CardHeader>
          <OrdersFilters
            filters={filters}
            hasActiveFilters={hasActiveFilters}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </CardHeader>
        <CardContent>
          {status === "pending" ? (
            <OrdersTableSkeleton rows={filters.pageSize} />
          ) : status === "error" ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : isEmpty ? (
            <EmptyState
              icon={PackageOpen}
              title={hasActiveFilters ? "No orders match these filters" : "No orders yet"}
              description={
                hasActiveFilters
                  ? "Try a different search term, status or date range."
                  : "Orders will appear here as soon as customers start buying."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            // While a new page/filter loads, keep the previous rows visible but
            // dimmed instead of flashing a skeleton (no layout jump).
            <div
              className={cn("flex flex-col gap-4 transition-opacity", isFetching && "opacity-60")}
              aria-busy={isFetching}
            >
              <OrdersTable
                orders={data.items}
                selectedId={selectedOrderId}
                onSelect={handleSelect}
              />
              <OrdersPagination
                page={data.page}
                totalPages={data.totalPages}
                total={data.total}
                pageSize={data.pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailsSheet orderId={selectedOrderId} onClose={handleCloseDetails} />
    </>
  );
}
