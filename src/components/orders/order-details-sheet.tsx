"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Mail } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderDetailOptions } from "@/lib/api/query-options";
import { formatCurrency, formatDateTime, pluralize } from "@/lib/format";
import type { Order } from "@/lib/types";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderDetailsSheetProps {
  orderId: string | null;
  onClose: () => void;
}

/**
 * Slide-over with the full order (line items are only loaded on demand; the
 * list endpoint returns summaries). Cached per order, so re-opening is instant.
 */
export function OrderDetailsSheet({ orderId, onClose }: OrderDetailsSheetProps) {
  // Remember the last opened order so the content stays rendered during the
  // close animation instead of blanking the moment `orderId` becomes null.
  const [displayedId, setDisplayedId] = useState(orderId);
  if (orderId !== null && orderId !== displayedId) setDisplayedId(orderId);

  const query = useQuery({
    ...orderDetailOptions(displayedId ?? ""),
    enabled: displayedId !== null,
  });

  return (
    <Sheet
      open={orderId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>
            {query.data ? `Order ${query.data.id}` : "Order details"}
          </SheetTitle>
          <SheetDescription>
            {query.data
              ? `Placed ${formatDateTime(query.data.createdAt)}`
              : query.isError
                ? "The order could not be loaded."
                : "Loading order…"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            {query.isPending ? <OrderDetailsSkeleton /> : null}
            {query.isError ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
            ) : null}
            {query.data ? <OrderDetails order={query.data} /> : null}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Total</p>
          <p className="font-heading text-2xl font-semibold">
            {formatCurrency(order.total, "precise")}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="mt-1" />
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase">Customer</h3>
        <div className="rounded-lg border p-3 text-sm">
          <p className="font-medium">{order.customerName}</p>
          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Mail className="size-3.5" aria-hidden="true" />
            <a href={`mailto:${order.customerEmail}`} className="truncate hover:underline">
              {order.customerEmail}
            </a>
          </p>
          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden="true" />
            <span className="font-mono text-xs">{order.customerId}</span>
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase">
          {order.items.length} {pluralize(order.items.length, "item")}
        </h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Qty</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id} className="hover:bg-transparent">
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums sm:hidden">
                      {item.quantity} × {formatCurrency(item.unitPrice, "precise")}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="hidden text-right text-muted-foreground tabular-nums sm:table-cell">
                    {formatCurrency(item.unitPrice, "precise")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(item.unitPrice * item.quantity, "precise")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Separator />
          <dl className="space-y-1 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatCurrency(subtotal, "precise")}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Tax</dt>
              <dd className="tabular-nums">{formatCurrency(0, "precise")}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(order.total, "precise")}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

function OrderDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading order">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-5 w-20 rounded-4xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
