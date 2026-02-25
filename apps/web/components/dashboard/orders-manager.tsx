"use client";

import { useMemo, useState } from "react";
import { OrderDetailPanel } from "@/components/dashboard/order-detail-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataStat } from "@/components/ui/data-stat";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField } from "@/components/ui/form-field";
import { RowActionButton } from "@/components/ui/row-actions";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderRecord } from "@/types/database";

type OrdersManagerProps = {
  initialOrders: Array<
    Pick<
      OrderRecord,
      | "id"
      | "customer_email"
      | "subtotal_cents"
      | "total_cents"
      | "status"
      | "fulfillment_status"
      | "discount_cents"
      | "promo_code"
      | "platform_fee_cents"
      | "created_at"
    >
  >;
};

type OrderStatus = OrderRecord["status"];

type OrdersResponse = {
  order?: Pick<
    OrderRecord,
    | "id"
    | "customer_email"
    | "subtotal_cents"
    | "total_cents"
    | "status"
    | "fulfillment_status"
    | "discount_cents"
    | "promo_code"
    | "platform_fee_cents"
    | "created_at"
  >;
  error?: string;
};

const statusOptions: OrderStatus[] = ["pending", "paid", "failed", "cancelled"];
const fulfillmentOptions: Array<OrderRecord["fulfillment_status"]> = ["unfulfilled", "processing", "fulfilled", "shipped"];

export function OrdersManager({ initialOrders }: OrdersManagerProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const gross = orders.reduce((sum, order) => sum + order.total_cents, 0);
    const fees = orders.reduce((sum, order) => sum + order.platform_fee_cents, 0);
    return { gross, fees, count: orders.length };
  }, [orders]);

  const visibleOrders = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );

  async function updateStatus(orderId: string, status: OrderStatus) {
    setError(null);

    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status })
    });

    const payload = (await response.json()) as OrdersResponse;

    if (!response.ok || !payload.order) {
      setError(payload.error ?? "Unable to update order status.");
      return;
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? payload.order! : order)));
  }

  async function updateFulfillment(orderId: string, fulfillmentStatus: OrderRecord["fulfillment_status"]) {
    setError(null);

    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, fulfillmentStatus })
    });

    const payload = (await response.json()) as OrdersResponse;

    if (!response.ok || !payload.order) {
      setError(payload.error ?? "Unable to update fulfillment status.");
      return;
    }

    setOrders((current) => current.map((order) => (order.id === orderId ? payload.order! : order)));
  }

  async function exportOrdersCsv() {
    setError(null);
    setExporting(true);

    const response = await fetch("/api/orders/export");

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Unable to export orders." }))) as { error?: string };
      setError(payload.error ?? "Unable to export orders.");
      setExporting(false);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orders.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-2xl">Orders</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => void exportOrdersCsv()} disabled={exporting}>
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
        <FormField label="Filter status" className="block max-w-52" labelClassName="text-xs uppercase tracking-wide text-muted-foreground">
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
              ))}
          </Select>
        </FormField>
        <div className="grid gap-2 sm:grid-cols-3">
          <DataStat label="Orders" value={String(totals.count)} />
          <DataStat label="Gross" value={`$${(totals.gross / 100).toFixed(2)}`} />
          <DataStat label="Platform fees" value={`$${(totals.fees / 100).toFixed(2)}`} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

      <FeedbackMessage type="error" message={error} />

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/45">
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Platform Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOrders.length === 0 ? (
              <TableRow>
                <TableCell className="py-3 text-muted-foreground" colSpan={8}>
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              visibleOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                  <TableCell>{order.customer_email}</TableCell>
                  <TableCell>${(order.total_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    {order.discount_cents > 0 ? `-$${(order.discount_cents / 100).toFixed(2)}` : "$0.00"}
                    {order.promo_code ? <p className="text-xs text-muted-foreground">{order.promo_code}</p> : null}
                  </TableCell>
                  <TableCell>${(order.platform_fee_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Select value={order.status} onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)}>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.fulfillment_status}
                      onChange={(event) =>
                        void updateFulfillment(order.id, event.target.value as OrderRecord["fulfillment_status"])
                      }
                    >
                      {fulfillmentOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <RowActionButton type="button" onClick={() => setSelectedOrderId(order.id)}>
                      View
                    </RowActionButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <OrderDetailPanel orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      </CardContent>
    </Card>
  );
}
