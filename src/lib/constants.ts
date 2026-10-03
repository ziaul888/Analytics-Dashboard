/**
 * App-wide constants and enums.
 *
 * These literal unions are the single source of truth for order statuses,
 * date-range keys and activity types. The zod schemas in `types.ts` build
 * their enums from these arrays so runtime validation and TypeScript types can
 * never drift apart.
 */

export const APP_NAME = "Pulse";
export const APP_DESCRIPTION =
  "SaaS analytics dashboard for customers, orders and system activity.";

// ---- Orders ----------------------------------------------------------------

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "completed",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses that count towards recognized revenue. */
export const REVENUE_STATUSES: readonly OrderStatus[] = [
  "completed",
  "processing",
  "pending",
];

/** UI metadata for rendering status badges consistently everywhere. */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  },
  processing: {
    label: "Processing",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400",
  },
  completed: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400",
  },
  refunded: {
    label: "Refunded",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400",
  },
};

export const ORDER_STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: OrderStatus | "all";
  label: string;
}> = [
  { value: "all", label: "All statuses" },
  ...ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_META[status].label,
  })),
];

// ---- Date ranges -----------------------------------------------------------

export const DATE_RANGES = [
  { key: "7d", label: "Last 7 days", short: "7D", days: 7 },
  { key: "30d", label: "Last 30 days", short: "30D", days: 30 },
  { key: "90d", label: "Last 90 days", short: "90D", days: 90 },
  { key: "all", label: "All time", short: "All", days: null },
] as const;

export type DateRangeKey = (typeof DATE_RANGES)[number]["key"];

export const DATE_RANGE_KEYS = DATE_RANGES.map((r) => r.key) as [
  DateRangeKey,
  ...DateRangeKey[],
];

/** Default range for the dashboard overview. */
export const DEFAULT_RANGE: DateRangeKey = "30d";
/** Default range for the orders list (show everything until filtered). */
export const DEFAULT_ORDERS_RANGE: DateRangeKey = "all";

export function rangeToDays(key: DateRangeKey): number | null {
  return DATE_RANGES.find((r) => r.key === key)?.days ?? null;
}

export function rangeLabel(key: DateRangeKey): string {
  return DATE_RANGES.find((r) => r.key === key)?.label ?? key;
}

/** URL param that opens the order-details panel (deep-linkable, read on server and client). */
export const ORDER_PARAM = "order";

// ---- Pagination ------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

// ---- Activities ------------------------------------------------------------

export const ACTIVITY_TYPES = [
  "order",
  "customer",
  "payment",
  "refund",
  "system",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// ---- Dashboard widgets -----------------------------------------------------

export const RECENT_ORDERS_LIMIT = 6;
export const ACTIVITY_FEED_LIMIT = 8;

// ---- Mock-API simulation (demo/dev only) -----------------------------------

/**
 * Append `?simulate=<mode>` to any page or API URL to exercise the error,
 * empty and malformed-response code paths without editing the dataset.
 */
export const SIMULATION_MODES = ["error", "empty", "malformed"] as const;
export type SimulationMode = (typeof SIMULATION_MODES)[number];
export const SIMULATE_PARAM = "simulate";
