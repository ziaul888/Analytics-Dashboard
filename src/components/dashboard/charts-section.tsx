import { ChartColumn } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DateRangeKey, SimulationMode } from "@/lib/constants";
import { getAnalytics } from "@/lib/server/queries";
import { OrdersChart } from "./orders-chart";
import { RevenueChart } from "./revenue-chart";

interface ChartsSectionProps {
  range: DateRangeKey;
  simulate?: SimulationMode;
}

/**
 * Async Server Component. Calls the same `getAnalytics` as `StatsGrid`; thanks
 * to `React.cache` the computation runs once per request even though the two
 * sections stream independently.
 */
export async function ChartsSection({ range, simulate }: ChartsSectionProps) {
  const analytics = await getAnalytics(range, simulate);
  const hasData = analytics.timeseries.some((p) => p.orders > 0 || p.revenue > 0);
  const per = analytics.granularity === "week" ? "week" : "day";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Revenue" description={`Recognized revenue per ${per}`}>
        {hasData ? (
          <RevenueChart data={analytics.timeseries} granularity={analytics.granularity} />
        ) : (
          <ChartEmptyState />
        )}
      </ChartCard>
      <ChartCard title="Orders" description={`Orders placed per ${per}`}>
        {hasData ? (
          <OrdersChart data={analytics.timeseries} granularity={analytics.granularity} />
        ) : (
          <ChartEmptyState />
        )}
      </ChartCard>
    </div>
  );
}

export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ChartEmptyState() {
  return (
    <EmptyState
      icon={ChartColumn}
      title="No data for this period"
      description="Try a wider date range."
      className="h-64 py-0"
    />
  );
}
