/** Activities service (browser). */

import { activitiesSchema, type Activity } from "@/lib/types";
import { apiFetch } from "./client";
import { endpoints, type ActivitiesQuery } from "./contracts";

export function fetchActivities(
  query: ActivitiesQuery,
  signal?: AbortSignal,
): Promise<Activity[]> {
  return apiFetch(endpoints.activities(query), activitiesSchema, { signal });
}
