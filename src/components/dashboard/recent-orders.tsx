import { ArrowRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ORDER_PARAM, RECENT_ORDERS_LIMIT, type SimulationMode } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { getRecentOrders } from "@/lib/server/queries";

/** Async Server Component; rows deep-link into the orders page's detail panel. */
export async function RecentOrders({ simulate }: { simulate?: SimulationMode }) {
  const orders = await getRecentOrders(RECENT_ORDERS_LIMIT, simulate);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>The latest {RECENT_ORDERS_LIMIT} orders placed</CardDescription>
        <CardAction>
          <Link href="/orders" className={buttonVariants({ variant: "outline", size: "sm" })}>
            View all
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No orders yet"
            description="New orders will show up here as they come in."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead className="hidden sm:table-cell">Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/orders?${ORDER_PARAM}=${encodeURIComponent(order.id)}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {order.id}
                    </Link>
                    <div className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="max-w-[14rem] truncate">{order.customerName}</div>
                    <div className="max-w-[14rem] truncate text-xs text-muted-foreground">
                      {order.customerEmail}
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(order.total, "precise")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
