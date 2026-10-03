import { Activity as ActivityIcon, CreditCard, RotateCcw, Server, ShoppingCart, UserPlus, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACTIVITY_FEED_LIMIT, type ActivityType, type SimulationMode } from "@/lib/constants";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { getActivities, getDatasetNow } from "@/lib/server/queries";
import { cn } from "@/lib/utils";

const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  order: { icon: ShoppingCart, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  customer: { icon: UserPlus, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  payment: { icon: CreditCard, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  refund: { icon: RotateCcw, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  system: { icon: Server, className: "bg-muted text-muted-foreground" },
};

/** Async Server Component listing the latest system events. */
export async function ActivityFeed({ simulate }: { simulate?: SimulationMode }) {
  const activities = await getActivities(ACTIVITY_FEED_LIMIT, simulate);
  const now = getDatasetNow();

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>System activity</CardTitle>
        <CardDescription>Orders, payments and platform events</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No recent activity"
            description="Events will appear here as they happen."
          />
        ) : (
          <ol className="flex flex-col gap-4">
            {activities.map((activity) => {
              const meta = ACTIVITY_META[activity.type];
              return (
                <li key={activity.id} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      meta.className,
                    )}
                  >
                    <meta.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{activity.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
                        {formatRelativeTime(activity.createdAt, now)}
                      </time>
                      {" · "}
                      {activity.actor}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
