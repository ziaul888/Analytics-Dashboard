"use client";

import { memo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, pluralize } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";

interface OrdersTableProps {
  orders: OrderSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OrdersTable({ orders, selectedId, onSelect }: OrdersTableProps) {
  return (
    <Table>
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
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            selected={order.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </TableBody>
    </Table>
  );
}

interface OrderRowProps {
  order: OrderSummary;
  selected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Memoised so that opening/closing the details panel (which changes
 * `selectedId` on the parent) re-renders only the two affected rows, not the
 * whole page of rows. Relies on `onSelect` being a stable reference.
 */
const OrderRow = memo(function OrderRow({ order, selected, onSelect }: OrderRowProps) {
  return (
    <TableRow
      data-state={selected ? "selected" : undefined}
      onClick={() => onSelect(order.id)}
      className={cn("cursor-pointer", selected && "bg-muted")}
    >
      <TableCell>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(order.id);
          }}
          className="font-medium underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          aria-label={`View details for order ${order.id}`}
        >
          {order.id}
        </button>
        <div className="max-w-[9rem] text-xs text-muted-foreground sm:hidden">
          <div className="truncate">{order.customerName}</div>
          <div>{formatDate(order.createdAt)}</div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <div className="max-w-[16rem] truncate">{order.customerName}</div>
        <div className="max-w-[16rem] truncate text-xs text-muted-foreground">
          {order.customerEmail}
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        {formatDate(order.createdAt)}
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {order.itemCount} {pluralize(order.itemCount, "item")}
      </TableCell>
      <TableCell>
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(order.total, "precise")}
      </TableCell>
    </TableRow>
  );
});
