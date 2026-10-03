import { OrdersViewSkeleton } from "@/components/orders/orders-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-72" />
      </div>
      <OrdersViewSkeleton />
    </div>
  );
}
