"use client";

import { useMemo } from "react";

import { formatBucketDate } from "@/lib/format";
import type { Granularity, TimeSeriesPoint } from "@/lib/types";

export interface ChartPoint extends TimeSeriesPoint {
  /** Short axis label, e.g. "Sep 3". */
  label: string;
  /** Tooltip label, e.g. "Week of Sep 3, 2026". */
  fullLabel: string;
}

/**
 * Formats date labels once per dataset instead of on every render / hover.
 * Recharts re-renders on every pointer move, so this memo is meaningful.
 */
export function useChartPoints(
  data: TimeSeriesPoint[],
  granularity: Granularity,
): ChartPoint[] {
  return useMemo(
    () =>
      data.map((point) => ({
        ...point,
        label: formatBucketDate(point.date),
        fullLabel:
          granularity === "week"
            ? `Week of ${formatBucketDate(point.date, true)}`
            : formatBucketDate(point.date, true),
      })),
    [data, granularity],
  );
}
