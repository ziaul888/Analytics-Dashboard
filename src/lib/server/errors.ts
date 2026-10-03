/** Server-side error types mapped to HTTP responses by `lib/server/http.ts`. */

export class NotFoundError extends Error {
  constructor(message = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Thrown when `?simulate=error` is requested (demo of failure handling). */
export class SimulatedFailureError extends Error {
  constructor() {
    super(
      "Simulated upstream failure (triggered by ?simulate=error). Remove the parameter to recover.",
    );
    this.name = "SimulatedFailureError";
  }
}
