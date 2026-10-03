/**
 * Typed error surface for the browser API client. UI code switches on `code`
 * to decide what to show (retry button, "not found" state, etc.) instead of
 * string-matching messages.
 */

export type ApiErrorCode =
  | "NETWORK" // fetch() rejected: offline, DNS, CORS...
  | "TIMEOUT" // no response within the timeout budget
  | "ABORTED" // cancelled by the caller (navigation, filter change)
  | "HTTP" // non-2xx response (4xx/5xx) other than 404
  | "NOT_FOUND" // 404
  | "INVALID_RESPONSE"; // 2xx but the body failed schema validation

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
  }

  /** Errors worth a "Try again" button (transient by nature). */
  get isRetryable(): boolean {
    return (
      this.code === "NETWORK" ||
      this.code === "TIMEOUT" ||
      (this.code === "HTTP" && (this.status ?? 0) >= 500)
    );
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

