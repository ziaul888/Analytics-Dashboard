import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrdersTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Table aria-busy="true" aria-label="Loading orders">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Order</TableHead>
          <TableHead className="hidden sm:table-cell">Customer</TableHead>
          <TableHead className="hidden md:table-cell">Date</TableHead>
          <TableHead className="hidden lg:table-cell">Items</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }, (_, i) => (
          <TableRow key={i} className="hover:bg-transparent">
            <TableCell>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-1.5 h-3 w-32 sm:hidden" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-40" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20 rounded-4xl" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Whole-card skeleton used by `orders/loading.tsx` and the Suspense fallback. */
export function OrdersViewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Skeleton className="h-8 flex-1" />
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Skeleton className="h-8 md:w-40" />
            <Skeleton className="h-8 md:w-40" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <OrdersTableSkeleton />
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-7 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}
