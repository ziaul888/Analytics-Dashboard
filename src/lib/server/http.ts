/**
 * HTTP framing for route handlers: consistent JSON envelopes and a single
 * place that maps thrown errors to status codes.
 *
 *   success -> 200 { data: ... }
 *   failure -> 4xx/5xx { error: { code, message } }
 */

import "server-only";

import { ZodError } from "zod";
import { NotFoundError, SimulatedFailureError } from "./errors";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ data }, { ...init, headers: { ...NO_STORE, ...init?.headers } });
}

export function fail(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, { status, headers: NO_STORE });
}

/** Intentionally wrong shape, for `?simulate=malformed`. */
export function malformed(): Response {
  return Response.json(
    { data: { unexpected: true, note: "This payload violates the API schema on purpose." } },
    { headers: NO_STORE },
  );
}

function describeZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

/** Wrap a handler body so every failure becomes a well-formed error response. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) {
      return fail(400, "BAD_REQUEST", `Invalid query: ${describeZodError(error)}`);
    }
    if (error instanceof NotFoundError) {
      return fail(404, "NOT_FOUND", error.message);
    }
    if (error instanceof SimulatedFailureError) {
      return fail(503, "SIMULATED_FAILURE", error.message);
    }
    console.error("[api] unhandled error", error);
    return fail(500, "INTERNAL_ERROR", "Something went wrong while processing the request.");
  }
}

export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(params.entries());
}
