/** Orders service (browser). Typed wrappers over the mock REST API. */

import type { SimulationMode } from "@/lib/constants";
import { orderSchema, paginatedOrdersSchema } from "@/lib/types";
import type { Order, PaginatedOrders } from "@/lib/types";
import { apiFetch } from "./client";
import { endpoints, type OrdersQuery } from "./contracts";

export function fetchOrders(
  query: OrdersQuery,
  signal?: AbortSignal,
): Promise<PaginatedOrders> {
  return apiFetch(endpoints.orders(query), paginatedOrdersSchema, { signal });
}

export function fetchOrder(
  id: string,
  signal?: AbortSignal,
  simulate?: SimulationMode,
): Promise<Order> {
  return apiFetch(endpoints.order(id, simulate), orderSchema, { signal });
}
