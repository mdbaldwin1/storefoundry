"use client";

import { useMemo, useState } from "react";
import { OrderDetailPanel } from "@/components/dashboard/order-detail-panel";
import type { OrderRecord } from "@/types/database";

type OrdersManagerProps = {
  initialOrders: Array<
    Pick<OrderRecord, "id" | "customer_email" | "subtotal_cents" | "total_cents" | "status" | "platform_fee_cents" | "created_at">
  >;
};

type OrderStatus = OrderRecord["status"];

type OrdersResponse = {
  order?: Pick<OrderRecord, "id" | "customer_email" | "subtotal_cents" | "total_cents" | "status" | "platform_fee_cents" | "created_at">;
  error?: string;
};

const statusOptions: OrderStatus[] = ["pending", "paid", "failed", "cancelled"];

export function OrdersManager({ initialOrders }: OrdersManagerProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const gross = orders.reduce((sum, order) => sum + order.total_cents, 0);
    const fees = orders.reduce((sum, order) => sum + order.platform_fee_cents, 0);
    return { gross, fees, count: orders.length };
  }, [orders]);

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

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="grid gap-2 sm:grid-cols-3">
          <p className="rounded-md border border-border bg-muted/45 px-3 py-2 text-sm">Orders: {totals.count}</p>
          <p className="rounded-md border border-border bg-muted/45 px-3 py-2 text-sm">
            Gross: ${(totals.gross / 100).toFixed(2)}
          </p>
          <p className="rounded-md border border-border bg-muted/45 px-3 py-2 text-sm">
            Platform fees: ${(totals.fees / 100).toFixed(2)}
          </p>
        </div>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/45">
            <tr>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Platform Fee</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-3 py-2">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{order.customer_email}</td>
                  <td className="px-3 py-2">${(order.total_cents / 100).toFixed(2)}</td>
                  <td className="px-3 py-2">${(order.platform_fee_cents / 100).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <select
                      value={order.status}
                      onChange={(event) => void updateStatus(order.id, event.target.value as OrderStatus)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="rounded-md border border-border px-2 py-1 text-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <OrderDetailPanel orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </section>
  );
}
