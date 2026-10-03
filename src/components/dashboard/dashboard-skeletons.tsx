import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ACTIVITY_FEED_LIMIT, RECENT_ORDERS_LIMIT } from "@/lib/constants";

export function StatsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading metrics">
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} size="sm">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-8 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function ChartsSectionSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Loading charts">
      <ChartCardSkeleton />
      <ChartCardSkeleton />
    </div>
  );
}

export function RecentOrdersSkeleton() {
  return (
    <Card className="lg:col-span-3" aria-busy="true" aria-label="Loading recent orders">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: RECENT_ORDERS_LIMIT }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="hidden h-4 w-36 sm:block" />
            <Skeleton className="h-5 w-20 rounded-4xl" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <Card className="lg:col-span-2" aria-busy="true" aria-label="Loading activity">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {Array.from({ length: ACTIVITY_FEED_LIMIT }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Full-page fallback for `app/loading.tsx`. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-52" />
      </div>
      <StatsGridSkeleton />
      <ChartsSectionSkeleton />
      <div className="grid gap-4 lg:grid-cols-5">
        <RecentOrdersSkeleton />
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
}
