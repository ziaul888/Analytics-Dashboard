/**
 * API contract shared by both sides of the HTTP boundary.
 *
 *  - Route handlers (`app/api/**`) parse incoming query strings with these
 *    schemas and reject anything invalid with a 400.
 *  - The browser service layer (`lib/api/*.ts`) serialises typed queries into
 *    URLs with `endpoints.*` and validates responses against the envelopes.
 *  - Client hooks reuse the same schemas to read filter state from the URL.
 *
 * Nothing in here touches React or the dataset.
 */

import { z } from "zod";
import {
  DEFAULT_ORDERS_RANGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RANGE,
  ORDER_STATUSES,
  PAGE_SIZE_OPTIONS,
  SIMULATE_PARAM,
  SIMULATION_MODES,
} from "@/lib/constants";
import { dateRangeKeySchema } from "@/lib/types";

// ---- Query schemas ---------------------------------------------------------

export const simulationModeSchema = z.enum(SIMULATION_MODES);

const pageSizeSchema = z.coerce
  .number()
  .int()
  .refine(
    (n): n is (typeof PAGE_SIZE_OPTIONS)[number] =>
      (PAGE_SIZE_OPTIONS as readonly number[]).includes(n),
    { message: `pageSize must be one of ${PAGE_SIZE_OPTIONS.join(", ")}` },
  );

export const ordersQuerySchema = z.object({
  search: z.string().max(100).default(""),
  status: z.enum([...ORDER_STATUSES, "all"]).default("all"),
  range: dateRangeKeySchema.default(DEFAULT_ORDERS_RANGE),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema.default(DEFAULT_PAGE_SIZE),
  [SIMULATE_PARAM]: simulationModeSchema.optional(),
});

export const analyticsQuerySchema = z.object({
  range: dateRangeKeySchema.default(DEFAULT_RANGE),
  [SIMULATE_PARAM]: simulationModeSchema.optional(),
});

export const activitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(8),
  [SIMULATE_PARAM]: simulationModeSchema.optional(),
});

export const orderDetailQuerySchema = z.object({
  [SIMULATE_PARAM]: simulationModeSchema.optional(),
});

export type OrdersQuery = z.infer<typeof ordersQuerySchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
export type ActivitiesQuery = z.infer<typeof activitiesQuerySchema>;

export const ORDERS_QUERY_KEYS = Object.keys(
  ordersQuerySchema.shape,
) as (keyof OrdersQuery)[];

// ---- Lenient parsing (for URL state) ---------------------------------------

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function toRecord(input: SearchParamsInput): Record<string, string> {
  const out: Record<string, string> = {};
  if (input instanceof URLSearchParams) {
    input.forEach((value, key) => {
      if (!(key in out)) out[key] = value;
    });
    return out;
  }
  for (const [key, value] of Object.entries(input)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (typeof first === "string") out[key] = first;
  }
  return out;
}

/**
 * Parse field-by-field, falling back to each field's default when a value is
 * invalid. Used for *URL state*, where a hand-edited `?page=abc` should
 * degrade gracefully instead of breaking the page. The API routes use the
 * strict `schema.parse` instead and return 400s.
 */
export function parseLenient<T extends z.ZodObject>(
  schema: T,
  input: SearchParamsInput,
): z.infer<T> {
  const record = toRecord(input);
  const result: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    const parsed = (field as z.ZodType).safeParse(record[key]);
    result[key] = parsed.success
      ? parsed.data
      : (field as z.ZodType).safeParse(undefined).data;
  }
  return result as z.infer<T>;
}

// ---- Serialisation ---------------------------------------------------------

const ORDERS_QUERY_DEFAULTS = ordersQuerySchema.parse({});

/**
 * Serialise a query to URLSearchParams, omitting values that equal the
 * defaults so URLs stay short and cache keys stay canonical.
 */
export function ordersQueryToSearchParams(query: OrdersQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of ORDERS_QUERY_KEYS) {
    const value = query[key];
    if (value === undefined || value === ORDERS_QUERY_DEFAULTS[key]) continue;
    params.set(key, String(value));
  }
  return params;
}

function withQuery(path: string, params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// ---- Endpoints -------------------------------------------------------------

export const endpoints = {
  analytics: (query: AnalyticsQuery) => {
    const params = new URLSearchParams({ range: query.range });
    if (query.simulate) params.set(SIMULATE_PARAM, query.simulate);
    return withQuery("/api/analytics", params);
  },
  orders: (query: OrdersQuery) =>
    withQuery("/api/orders", ordersQueryToSearchParams(query)),
  order: (id: string, simulate?: z.infer<typeof simulationModeSchema>) => {
    const params = new URLSearchParams();
    if (simulate) params.set(SIMULATE_PARAM, simulate);
    return withQuery(`/api/orders/${encodeURIComponent(id)}`, params);
  },
  activities: (query: ActivitiesQuery) => {
    const params = new URLSearchParams({ limit: String(query.limit) });
    if (query.simulate) params.set(SIMULATE_PARAM, query.simulate);
    return withQuery("/api/activities", params);
  },
} as const;

// ---- Response envelopes ----------------------------------------------------

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;

export function apiSuccessBodySchema<T extends z.ZodType>(data: T) {
  return z.object({ data });
}
