/**
 * Server-only data-access layer (the "repository").
 *
 * This is the only module that touches the raw JSON dataset. It validates the
 * dataset against the shared zod schemas on first load, so a corrupt file fails
 * fast with a clear message instead of surfacing as `undefined is not a
 * function` somewhere in the UI.
 *
 * Route handlers and Server Components never import this directly; they go
 * through `lib/server/queries.ts`. The `server-only` import makes the build
 * fail loudly if it is ever pulled into a client bundle.
 *
 * All date-range filtering is anchored to the dataset's most recent order
 * (`getDatasetNow`) rather than the wall clock, so the demo always shows
 * populated charts no matter when it is run.
 */

import "server-only";

import { z } from "zod";

import activitiesJson from "@/data/activities.json";
import customersJson from "@/data/customers.json";
import ordersJson from "@/data/orders.json";
import trafficJson from "@/data/traffic.json";

import {
  DEFAULT_PAGE_SIZE,
  rangeToDays,
  type DateRangeKey,
  type OrderStatus,
} from "@/lib/constants";
import {
  activitySchema,
  customerSchema,
  orderSchema,
  trafficPointSchema,
  type Activity,
  type Customer,
  type Order,
  type OrderSummary,
  type Paginated,
  type TrafficPoint,
} from "@/lib/types";

export const DAY_MS = 86_400_000;

// ---- Dataset loading (validated once per server instance) ------------------

function loadDataset<T>(name: string, schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue ? ` at ${issue.path.join(".")}: ${issue.message}` : "";
    throw new Error(`Dataset "${name}" is malformed${where}`);
  }
  return result.data;
}

const customers = loadDataset("customers", z.array(customerSchema), customersJson);
const activities = loadDataset("activities", z.array(activitySchema), activitiesJson);
const traffic = loadDataset("traffic", z.array(trafficPointSchema), trafficJson);
/** Orders, newest first. Sorted once so every query can slice without sorting. */
const orders = loadDataset("orders", z.array(orderSchema), ordersJson).sort(
  (a, b) => b.createdAt.localeCompare(a.createdAt),
);
const ordersById = new Map(orders.map((o) => [o.id, o]));

// ---- Time helpers ----------------------------------------------------------

/**
 * The dataset's "now": the latest timestamp across orders and activities.
 * Used instead of the wall clock for range filtering and relative times so the
 * demo reads the same whenever it is viewed.
 */
export function getDatasetNow(): number {
  const latestOrder = orders.length ? Date.parse(orders[0].createdAt) : 0;
  const latestActivity = activities.reduce(
    (max, a) => Math.max(max, Date.parse(a.createdAt)),
    0,
  );
  const latest = Math.max(latestOrder, latestActivity);
  return latest > 0 ? latest : Date.now();
}

/** Earliest order timestamp in the dataset. */
export function getDatasetStart(): number {
  return orders.length
    ? Date.parse(orders[orders.length - 1].createdAt)
    : getDatasetNow();
}

export function utcDayStart(ms: number): number {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

/** Inclusive lower bound (epoch ms) for a range key, or null for "all time". */
export function rangeLowerBound(range: DateRangeKey): number | null {
  const days = rangeToDays(range);
  if (days === null) return null;
  // Range windows are whole UTC days ending today (inclusive).
  return utcDayStart(getDatasetNow()) + DAY_MS - days * DAY_MS;
}

// ---- Orders ----------------------------------------------------------------

export interface OrderQuery {
  search?: string;
  status?: OrderStatus | "all";
  range?: DateRangeKey;
  page?: number;
  pageSize?: number;
}

export function toOrderSummary(order: Order): OrderSummary {
  const { items, ...rest } = order;
  return { ...rest, itemCount: items.length };
}

function matchesQuery(
  order: Order,
  opts: {
    search: string;
    status: OrderStatus | "all";
    lowerBound: number | null;
  },
): boolean {
  if (opts.status !== "all" && order.status !== opts.status) return false;
  if (
    opts.lowerBound !== null &&
    Date.parse(order.createdAt) < opts.lowerBound
  ) {
    return false;
  }
  if (opts.search) {
    const haystack =
      `${order.id} ${order.customerName} ${order.customerEmail}`.toLowerCase();
    if (!haystack.includes(opts.search)) return false;
  }
  return true;
}

/** Filter (newest first) + paginate the orders dataset. */
export function queryOrders(query: OrderQuery = {}): Paginated<OrderSummary> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE);
  const search = query.search?.trim().toLowerCase() ?? "";
  const status = query.status ?? "all";
  const lowerBound = query.range ? rangeLowerBound(query.range) : null;

  const filtered = orders.filter((o) =>
    matchesQuery(o, { search, status, lowerBound }),
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize).map(toOrderSummary);

  return { items, page: safePage, pageSize, total, totalPages };
}

export function getOrderById(id: string): Order | undefined {
  return ordersById.get(id);
}

/** Orders with `start <= createdAt < end` (epoch ms). */
export function getOrdersBetween(start: number, end: number): Order[] {
  return orders.filter((o) => {
    const t = Date.parse(o.createdAt);
    return t >= start && t < end;
  });
}

export function getRecentOrders(limit: number): OrderSummary[] {
  return orders.slice(0, limit).map(toOrderSummary);
}

// ---- Traffic ---------------------------------------------------------------

/** Daily traffic points with `start <= date < end` (epoch ms, UTC days). */
export function getTrafficBetween(start: number, end: number): TrafficPoint[] {
  return traffic.filter((t) => {
    const ms = Date.parse(`${t.date}T00:00:00.000Z`);
    return ms >= start && ms < end;
  });
}

// ---- Activities & customers ------------------------------------------------

export function getActivities(limit: number): Activity[] {
  return [...activities]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export function getCustomers(): Customer[] {
  return customers;
}
