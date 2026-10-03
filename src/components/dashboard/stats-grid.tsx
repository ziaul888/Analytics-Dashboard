import { DollarSign, Percent, ShoppingCart, Users, type LucideIcon } from "lucide-react";

import { rangeToDays, type DateRangeKey, type SimulationMode } from "@/lib/constants";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { getAnalytics } from "@/lib/server/queries";
import type { AnalyticsSummary } from "@/lib/types";
import { StatCard } from "./stat-card";

/** Presentation config for each KPI; the numbers come from the data layer. */
const KPI_CARDS: ReadonlyArray<{
  key: keyof AnalyticsSummary;
  label: string;
  icon: LucideIcon;
  format: (value: number) => string;
}> = [
  { key: "revenue", label: "Total revenue", icon: DollarSign, format: (v) => formatCurrency(v) },
  { key: "orders", label: "Orders", icon: ShoppingCart, format: (v) => formatNumber(v) },
  { key: "activeCustomers", label: "Active customers", icon: Users, format: (v) => formatNumber(v) },
  { key: "conversionRate", label: "Conversion rate", icon: Percent, format: (v) => formatPercent(v, 2) },
];

interface StatsGridProps {
  range: DateRangeKey;
  simulate?: SimulationMode;
}

/** Async Server Component: streams in independently of the charts. */
export async function StatsGrid({ range, simulate }: StatsGridProps) {
  const { summary } = await getAnalytics(range, simulate);
  const days = rangeToDays(range);
  const comparisonLabel = days === null ? "All-time total" : `vs. previous ${days} days`;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_CARDS.map((card) => {
        const metric = summary[card.key];
        return (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.format(metric.value)}
            changePct={metric.changePct}
            comparisonLabel={comparisonLabel}
            icon={card.icon}
          />
        );
      })}
    </div>
  );
}
