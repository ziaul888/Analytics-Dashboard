/**
 * Domain types + runtime schemas (the shared API contract).
 *
 * Every payload that crosses a boundary (JSON dataset -> server, API -> browser)
 * is described once as a zod schema; the TypeScript types are *inferred* from
 * those schemas. The server validates the dataset on load and the browser API
 * client validates every response, so malformed or unexpected data is caught at
 * the boundary instead of crashing a component deep in the tree.
 */

import { z } from "zod";
import { ACTIVITY_TYPES, DATE_RANGE_KEYS, ORDER_STATUSES } from "./constants";

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export const activityTypeSchema = z.enum(ACTIVITY_TYPES);
export const dateRangeKeySchema = z.enum(DATE_RANGE_KEYS);

// ---- Entities --------------------------------------------------------------

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  company: z.string(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
  totalSpent: z.number(),
  orderCount: z.number().int().nonnegative(),
});

export const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

/** Full order, including line items (returned by the detail endpoint). */
export const orderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  status: orderStatusSchema,
  total: z.number(),
  items: z.array(orderItemSchema),
  createdAt: z.string(),
});

/** Lightweight row used by list endpoints (no line items, just a count). */
export const orderSummarySchema = orderSchema
  .omit({ items: true })
  .extend({ itemCount: z.number().int().nonnegative() });

export const activitySchema = z.object({
  id: z.string(),
  type: activityTypeSchema,
  message: z.string(),
  actor: z.string(),
  createdAt: z.string(),
});

export const trafficPointSchema = z.object({
  /** ISO date (YYYY-MM-DD), UTC. */
  date: z.string(),
  visitors: z.number().int().nonnegative(),
});

// ---- Analytics -------------------------------------------------------------

/** A metric with its previous-period value and % change (null when N/A). */
export const metricSchema = z.object({
  value: z.number(),
  previousValue: z.number().nullable(),
  changePct: z.number().nullable(),
});

export const timeSeriesPointSchema = z.object({
  /** Bucket start date (YYYY-MM-DD). */
  date: z.string(),
  revenue: z.number(),
  orders: z.number(),
  visitors: z.number(),
});

export const analyticsSchema = z.object({
  range: dateRangeKeySchema,
  granularity: z.enum(["day", "week"]),
  periodStart: z.string(),
  periodEnd: z.string(),
  summary: z.object({
    revenue: metricSchema,
    orders: metricSchema,
    activeCustomers: metricSchema,
    conversionRate: metricSchema,
  }),
  timeseries: z.array(timeSeriesPointSchema),
});

// ---- Collections -----------------------------------------------------------

/** Generic paginated envelope used by list endpoints. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  });
}

export const paginatedOrdersSchema = paginatedSchema(orderSummarySchema);
export const activitiesSchema = z.array(activitySchema);

// ---- Inferred types (the schemas above are the single source of truth) -----

export type Customer = z.infer<typeof customerSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderSummary = z.infer<typeof orderSummarySchema>;
export type Activity = z.infer<typeof activitySchema>;
export type TrafficPoint = z.infer<typeof trafficPointSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type TimeSeriesPoint = z.infer<typeof timeSeriesPointSchema>;
export type Analytics = z.infer<typeof analyticsSchema>;
export type AnalyticsSummary = Analytics["summary"];
export type Granularity = Analytics["granularity"];

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type PaginatedOrders = Paginated<OrderSummary>;
