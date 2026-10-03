/**
 * Server data services: the single entry point for anything that runs on the
 * server and needs data, i.e. Server Components *and* API route handlers.
 *
 *   Server Component ──┐
 *                      ├──> queries.ts ──> analytics.ts / store.ts ──> JSON
 *   Route handler ─────┘
 *
 * Both consumers get identical results because they share this module; the
 * route handlers merely add HTTP framing on top. `React.cache` memoises calls
 * within a single request so, for example, the KPI grid and the charts can
 * each `await getAnalytics(range)` independently (and stream independently)
 * while the computation runs once.
 */

import "server-only";

import { cache } from "react";

import type { DateRangeKey, SimulationMode } from "@/lib/constants";
import type {
  Activity,
  Analytics,
  Order,
  OrderSummary,
  PaginatedOrders,
} from "@/lib/types";
import type { OrdersQuery } from "@/lib/api/contracts";
import { computeAnalytics, emptyAnalytics } from "./analytics";
import { NotFoundError } from "./errors";
import {
  assertNotSimulatedFailure,
  isSimulatedEmpty,
  simulateLatency,
} from "./simulation";
import * as store from "./store";

export const getAnalytics = cache(
  async (range: DateRangeKey, simulate?: SimulationMode): Promise<Analytics> => {
    await simulateLatency();
    assertNotSimulatedFailure(simulate);
    if (isSimulatedEmpty(simulate)) return emptyAnalytics(range);
    return computeAnalytics(range);
  },
);

export async function listOrders(query: OrdersQuery): Promise<PaginatedOrders> {
  await simulateLatency();
  assertNotSimulatedFailure(query.simulate);
  if (isSimulatedEmpty(query.simulate)) {
    return {
      items: [],
      page: 1,
      pageSize: query.pageSize,
      total: 0,
      totalPages: 1,
    };
  }
  return store.queryOrders(query);
}

export async function getOrder(
  id: string,
  simulate?: SimulationMode,
): Promise<Order> {
  await simulateLatency();
  assertNotSimulatedFailure(simulate);
  const order = store.getOrderById(id);
  if (!order || isSimulatedEmpty(simulate)) {
    throw new NotFoundError(`Order "${id}" was not found.`);
  }
  return order;
}

export const getRecentOrders = cache(
  async (limit: number, simulate?: SimulationMode): Promise<OrderSummary[]> => {
    await simulateLatency();
    assertNotSimulatedFailure(simulate);
    if (isSimulatedEmpty(simulate)) return [];
    return store.getRecentOrders(limit);
  },
);

export const getActivities = cache(
  async (limit: number, simulate?: SimulationMode): Promise<Activity[]> => {
    await simulateLatency();
    assertNotSimulatedFailure(simulate);
    if (isSimulatedEmpty(simulate)) return [];
    return store.getActivities(limit);
  },
);

/** The dataset's notion of "now" (latest order), used for relative times. */
export function getDatasetNow(): Date {
  return new Date(store.getDatasetNow());
}
