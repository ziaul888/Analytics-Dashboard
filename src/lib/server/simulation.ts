/**
 * Dev/demo helpers that make loading, error and empty states observable with a
 * local JSON dataset that would otherwise respond instantly and never fail.
 *
 *  - Latency: `MOCK_LATENCY_MS` env var (defaults to 400ms in development,
 *    0 in production).
 *  - Failure/empty: `?simulate=error|empty|malformed` on any page or API URL.
 */

import "server-only";

import type { SimulationMode } from "@/lib/constants";
import { SimulatedFailureError } from "./errors";

function resolveLatencyMs(): number {
  const raw = process.env.MOCK_LATENCY_MS;
  if (raw !== undefined && raw !== "") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  return process.env.NODE_ENV === "development" ? 400 : 0;
}

export async function simulateLatency(): Promise<void> {
  const ms = resolveLatencyMs();
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Throws when the caller asked for a simulated failure. */
export function assertNotSimulatedFailure(mode?: SimulationMode): void {
  if (mode === "error") throw new SimulatedFailureError();
}

export function isSimulatedEmpty(mode?: SimulationMode): boolean {
  return mode === "empty";
}
