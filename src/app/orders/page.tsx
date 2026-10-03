import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";

import { OrdersViewSkeleton } from "@/components/orders/orders-table-skeleton";
import { OrdersView } from "@/components/orders/orders-view";
import { PageHeader } from "@/components/shared/page-header";
import { ordersQuerySchema, parseLenient } from "@/lib/api/contracts";
import { queryKeys } from "@/lib/api/query-options";
import { ORDER_PARAM } from "@/lib/constants";
import { getServerQueryClient } from "@/lib/query/server";
import { getOrder, listOrders } from "@/lib/server/queries";

export const metadata: Metadata = { title: "Orders" };

/**
 * Orders page (Server Component).
 *
 * The interactive table is a Client Component driven by React Query, but the
 * first page of results is fetched here on the server, straight from the data
 * layer (no HTTP hop), and handed to the browser through a HydrationBoundary.
 * The client therefore renders real rows in the initial HTML and only talks
 * to the mock API when the user changes a filter or pages.
 *
 * The same `ordersQuerySchema` parses the URL on both sides, so the key the
 * server prefetches is byte-for-byte the key the client asks for.
 */
export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const params = await searchParams;
  const query = parseLenient(ordersQuerySchema, params);
  const selectedOrderId = typeof params[ORDER_PARAM] === "string" ? params[ORDER_PARAM] : null;

  const queryClient = getServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.orders.list(query),
      queryFn: () => listOrders(query),
    }),
    selectedOrderId
      ? queryClient.prefetchQuery({
          queryKey: queryKeys.orders.detail(selectedOrderId),
          queryFn: () => getOrder(selectedOrderId, query.simulate),
        })
      : null,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Search, filter and inspect every order placed by your customers."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<OrdersViewSkeleton />}>
          <OrdersView />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
