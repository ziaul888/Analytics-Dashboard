"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/format";
import type { Granularity, TimeSeriesPoint } from "@/lib/types";
import { ChartTooltipRow } from "./chart-tooltip-row";
import { type ChartPoint, useChartPoints } from "./use-chart-points";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface RevenueChartProps {
  data: TimeSeriesPoint[];
  granularity: Granularity;
}

export function RevenueChart({ data, granularity }: RevenueChartProps) {
  const points = useChartPoints(data, granularity);

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value: number) => formatCurrency(value, "compact")}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) =>
                (payload?.[0]?.payload as ChartPoint | undefined)?.fullLabel ?? ""
              }
              formatter={(value) => (
                <ChartTooltipRow
                  label="Revenue"
                  value={formatCurrency(Number(value), "precise")}
                  colorVar="--color-revenue"
                />
              )}
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#revenue-fill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
