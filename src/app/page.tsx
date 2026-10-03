import type { Metadata } from "next";
import { Suspense } from "react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ChartsSection } from "@/components/dashboard/charts-section";
import {
  ActivityFeedSkeleton,
  ChartsSectionSkeleton,
  RecentOrdersSkeleton,
  StatsGridSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { RangeSelector } from "@/components/dashboard/range-selector";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { PageHeader } from "@/components/shared/page-header";
import { analyticsQuerySchema, parseLenient } from "@/lib/api/contracts";
import { rangeLabel } from "@/lib/constants";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Dashboard (Server Component).
 *
 * Reads the date range from the URL and renders four independent async
 * sections, each inside its own Suspense boundary so they stream in as soon as
 * their data is ready. No client-side data fetching is needed: the data is
 * read-mostly and the only interaction (changing the range) is a navigation.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { range, simulate } = parseLenient(analyticsQuerySchema, await searchParams);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Revenue, orders and customer activity for the ${rangeLabel(range).toLowerCase()}.`}
        actions={<RangeSelector value={range} />}
      />

      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid range={range} simulate={simulate} />
      </Suspense>

      <Suspense fallback={<ChartsSectionSkeleton />}>
        <ChartsSection range={range} simulate={simulate} />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-5">
        <Suspense fallback={<RecentOrdersSkeleton />}>
          <RecentOrders simulate={simulate} />
        </Suspense>
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeed simulate={simulate} />
        </Suspense>
      </div>
    </div>
  );
}
