"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber } from "@/lib/format";
import type { Granularity, TimeSeriesPoint } from "@/lib/types";
import { ChartTooltipRow } from "./chart-tooltip-row";
import { type ChartPoint, useChartPoints } from "./use-chart-points";

const config = {
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface OrdersChartProps {
  data: TimeSeriesPoint[];
  granularity: Granularity;
}

export function OrdersChart({ data, granularity }: OrdersChartProps) {
  const points = useChartPoints(data, granularity);

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer barCategoryGap="20%">
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
          width={36}
          allowDecimals={false}
          tickFormatter={(value: number) => formatNumber(value, true)}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) =>
                (payload?.[0]?.payload as ChartPoint | undefined)?.fullLabel ?? ""
              }
              formatter={(value) => (
                <ChartTooltipRow
                  label="Orders"
                  value={formatNumber(Number(value))}
                  colorVar="--color-orders"
                />
              )}
            />
          }
        />
        <Bar
          dataKey="orders"
          fill="var(--color-orders)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
