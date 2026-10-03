/** Analytics service (browser). */

import { analyticsSchema, type Analytics } from "@/lib/types";
import { apiFetch } from "./client";
import { endpoints, type AnalyticsQuery } from "./contracts";

export function fetchAnalytics(
  query: AnalyticsQuery,
  signal?: AbortSignal,
): Promise<Analytics> {
  return apiFetch(endpoints.analytics(query), analyticsSchema, { signal });
}
