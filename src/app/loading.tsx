import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeletons";

/** Instant loading state shown while the dashboard route streams in. */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
