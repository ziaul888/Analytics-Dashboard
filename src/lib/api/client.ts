/**
 * Browser-side HTTP client for the mock API.
 *
 * One function, `apiFetch`, owns every cross-cutting concern so the service
 * modules (`orders.ts`, `analytics.ts`, ...) stay one-liners:
 *   - request timeout + caller-supplied AbortSignal (cancels stale requests)
 *   - HTTP error -> ApiError with the server's error envelope message
 *   - response validation with zod -> ApiError("INVALID_RESPONSE")
 *
 * Server Components do not use this module; they call `lib/server/queries`
 * directly (same data, no HTTP round-trip). See README › Data fetching.
 */

import type { z } from "zod";
import { apiErrorBodySchema, apiSuccessBodySchema } from "./contracts";
import { ApiError } from "./errors";

const DEFAULT_TIMEOUT_MS = 10_000;

export interface ApiFetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: ApiFetchOptions = {},
): Promise<T> {
  if (signal?.aborted) {
    throw new ApiError("ABORTED", "The request was cancelled.");
  }

  // Compose the caller's signal with our own timeout signal.
  const controller = new AbortController();
  const abortFromCaller = () =>
    controller.abort(
      new ApiError("ABORTED", "The request was cancelled."),
    );
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = setTimeout(
    () =>
      controller.abort(
        new ApiError("TIMEOUT", "The server took too long to respond."),
      ),
    timeoutMs,
  );

  let response: Response;
  try {
    response = await fetch(path, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (error) {
    const reason = controller.signal.reason;
    if (reason instanceof ApiError) throw reason;
    throw new ApiError(
      "NETWORK",
      "Unable to reach the server. Check your connection and try again.",
      { cause: error },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch (error) {
    if (response.ok) {
      throw new ApiError(
        "INVALID_RESPONSE",
        "The server returned a response that could not be read.",
        { status: response.status, cause: error },
      );
    }
  }

  if (!response.ok) {
    const parsed = apiErrorBodySchema.safeParse(body);
    const message = parsed.success
      ? parsed.data.error.message
      : `Request failed with status ${response.status}.`;
    throw new ApiError(response.status === 404 ? "NOT_FOUND" : "HTTP", message, {
      status: response.status,
    });
  }

  const result = apiSuccessBodySchema(schema).safeParse(body);
  if (!result.success) {
    throw new ApiError(
      "INVALID_RESPONSE",
      "The server returned data in an unexpected shape.",
      { status: response.status, cause: result.error },
    );
  }
  return result.data.data as T;
}
