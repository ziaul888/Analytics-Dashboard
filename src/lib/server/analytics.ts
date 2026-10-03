/**
 * Analytics transforms: turn raw orders + traffic into the `Analytics` payload
 * (KPI summary with period-over-period deltas, and a bucketed time series).
 *
 * Pure functions over the repository; no HTTP or React in here, so the same
 * code serves the API route and the Server Components.
 */

import "server-only";

import {
  REVENUE_STATUSES,
  rangeToDays,
  type DateRangeKey,
} from "@/lib/constants";
import type {
  Analytics,
  Granularity,
  Metric,
  Order,
  TimeSeriesPoint,
  TrafficPoint,
} from "@/lib/types";
import {
  DAY_MS,
  getDatasetNow,
  getDatasetStart,
  getOrdersBetween,
  getTrafficBetween,
  utcDayStart,
} from "./store";

const revenueStatuses = new Set<string>(REVENUE_STATUSES);
const round = (n: number, digits = 2) =>
  Math.round(n * 10 ** digits) / 10 ** digits;
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

interface Window {
  /** Inclusive start (UTC day boundary, epoch ms). */
  start: number;
  /** Exclusive end (UTC day boundary, epoch ms). */
  end: number;
  days: number;
  /** Null for "all time": there is no comparable previous period. */
  previous: { start: number; end: number } | null;
}

export function resolveWindow(range: DateRangeKey): Window {
  const end = utcDayStart(getDatasetNow()) + DAY_MS;
  const requestedDays = rangeToDays(range);
  const days =
    requestedDays ??
    Math.max(1, Math.round((end - utcDayStart(getDatasetStart())) / DAY_MS));
  const start = end - days * DAY_MS;
  return {
    start,
    end,
    days,
    previous:
      requestedDays === null ? null : { start: start - days * DAY_MS, end: start },
  };
}

interface Totals {
  revenue: number;
  orders: number;
  activeCustomers: number;
  visitors: number;
  conversionRate: number;
}

function summarize(orders: Order[], traffic: TrafficPoint[]): Totals {
  let revenue = 0;
  const customers = new Set<string>();
  for (const order of orders) {
    customers.add(order.customerId);
    if (revenueStatuses.has(order.status)) revenue += order.total;
  }
  const visitors = traffic.reduce((sum, t) => sum + t.visitors, 0);
  return {
    revenue: round(revenue),
    orders: orders.length,
    activeCustomers: customers.size,
    visitors,
    conversionRate: visitors ? round((orders.length / visitors) * 100) : 0,
  };
}

function metric(value: number, previous: number | null): Metric {
  if (previous === null) return { value, previousValue: null, changePct: null };
  const changePct =
    previous === 0
      ? value === 0
        ? 0
        : 100
      : round(((value - previous) / previous) * 100, 1);
  return { value, previousValue: previous, changePct };
}

function granularityFor(days: number): Granularity {
  return days > 31 ? "week" : "day";
}

function buildTimeseries(
  orders: Order[],
  traffic: TrafficPoint[],
  window: Window,
  granularity: Granularity,
): TimeSeriesPoint[] {
  const bucketMs = granularity === "week" ? 7 * DAY_MS : DAY_MS;
  const bucketCount = Math.ceil((window.days * DAY_MS) / bucketMs);
  const buckets: TimeSeriesPoint[] = Array.from(
    { length: bucketCount },
    (_, i) => ({
      date: isoDay(window.start + i * bucketMs),
      revenue: 0,
      orders: 0,
      visitors: 0,
    }),
  );
  const indexFor = (ms: number) =>
    Math.min(bucketCount - 1, Math.max(0, Math.floor((ms - window.start) / bucketMs)));

  for (const order of orders) {
    const bucket = buckets[indexFor(Date.parse(order.createdAt))];
    bucket.orders += 1;
    if (revenueStatuses.has(order.status)) bucket.revenue += order.total;
  }
  for (const point of traffic) {
    const bucket = buckets[indexFor(Date.parse(`${point.date}T00:00:00.000Z`))];
    bucket.visitors += point.visitors;
  }
  for (const bucket of buckets) bucket.revenue = round(bucket.revenue);
  return buckets;
}

export function computeAnalytics(range: DateRangeKey): Analytics {
  const window = resolveWindow(range);
  const orders = getOrdersBetween(window.start, window.end);
  const traffic = getTrafficBetween(window.start, window.end);
  const current = summarize(orders, traffic);
  const previous = window.previous
    ? summarize(
        getOrdersBetween(window.previous.start, window.previous.end),
        getTrafficBetween(window.previous.start, window.previous.end),
      )
    : null;
  const granularity = granularityFor(window.days);

  return {
    range,
    granularity,
    periodStart: isoDay(window.start),
    periodEnd: isoDay(window.end - DAY_MS),
    summary: {
      revenue: metric(current.revenue, previous?.revenue ?? null),
      orders: metric(current.orders, previous?.orders ?? null),
      activeCustomers: metric(
        current.activeCustomers,
        previous?.activeCustomers ?? null,
      ),
      conversionRate: metric(
        current.conversionRate,
        previous?.conversionRate ?? null,
      ),
    },
    timeseries: buildTimeseries(orders, traffic, window, granularity),
  };
}

/** Shape returned for `?simulate=empty`: a valid payload with no data. */
export function emptyAnalytics(range: DateRangeKey): Analytics {
  const window = resolveWindow(range);
  const zero = metric(0, null);
  return {
    range,
    granularity: granularityFor(window.days),
    periodStart: isoDay(window.start),
    periodEnd: isoDay(window.end - DAY_MS),
    summary: {
      revenue: zero,
      orders: zero,
      activeCustomers: zero,
      conversionRate: zero,
    },
    timeseries: [],
  };
}
