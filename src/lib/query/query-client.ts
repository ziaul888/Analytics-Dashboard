/**
 * TanStack Query client factory shared by the browser provider and the server
 * prefetch helper. Defaults are chosen for this app:
 *
 *  - `staleTime: 30s` so data hydrated from the server (or just fetched) is not
 *    refetched the moment a component mounts.
 *  - `retry` only for transient failures (network, timeout, 5xx). A 404 or a
 *    schema-validation failure will not get better by asking again.
 *  - `refetchOnWindowFocus: false`: a dashboard polling on every tab switch is
 *    surprising for users and noisy for the mock API.
 */

import { isServer, QueryClient } from "@tanstack/react-query";

import { type ApiError, isApiError } from "@/lib/api/errors";

// Every queryFn in this app goes through `apiFetch`, which only ever throws
// ApiError, so React Query's `error` can be typed as such everywhere.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}

export const DEFAULT_STALE_TIME_MS = 30_000;

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          failureCount < 2 && (isApiError(error) ? error.isRetryable : true),
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * On the server every request gets a fresh client (never share cache between
 * users). In the browser a single client lives for the whole session; it is a
 * module singleton rather than `useState` so a Suspense re-render can never
 * create a second client and drop the cache.
 */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
