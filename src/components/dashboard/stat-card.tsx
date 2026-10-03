import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatChange } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  /** Pre-formatted display value. */
  value: string;
  /** Percent change vs. the previous period; null when there is none. */
  changePct: number | null;
  comparisonLabel: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, changePct, comparisonLabel, icon: Icon }: StatCardProps) {
  const trend =
    changePct === null ? "none" : changePct > 0 ? "up" : changePct < 0 ? "down" : "flat";

  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">{value}</CardTitle>
        <CardAction>
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-xs text-muted-foreground">
        {trend === "none" ? (
          <Badge variant="outline" className="text-muted-foreground">
            <Minus aria-hidden="true" />
            n/a
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              trend === "up" &&
                "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400",
              trend === "down" &&
                "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400",
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight aria-hidden="true" />
            ) : trend === "down" ? (
              <ArrowDownRight aria-hidden="true" />
            ) : (
              <Minus aria-hidden="true" />
            )}
            <span className="tabular-nums">{formatChange(changePct ?? 0)}</span>
          </Badge>
        )}
        <span className="truncate">{comparisonLabel}</span>
      </CardContent>
    </Card>
  );
}
