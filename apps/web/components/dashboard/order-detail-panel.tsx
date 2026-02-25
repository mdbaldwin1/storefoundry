"use client";

import { useEffect, useState } from "react";

type OrderDetailPanelProps = {
  orderId: string | null;
  onClose: () => void;
};

type OrderDetailResponse = {
  order?: {
    id: string;
    customer_email: string;
    subtotal_cents: number;
    total_cents: number;
    status: string;
    platform_fee_bps: number;
    platform_fee_cents: number;
    currency: string;
    created_at: string;
  };
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    products?: { title?: string } | null;
  }>;
  error?: string;
};

export function OrderDetailPanel({ orderId, onClose }: OrderDetailPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<OrderDetailResponse | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let active = true;

    async function loadDetails() {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}`);
      const data = (await response.json()) as OrderDetailResponse;

      if (!active) {
        return;
      }

      setLoading(false);

      if (!response.ok || !data.order) {
        setError(data.error ?? "Unable to load order details.");
        return;
      }

      setPayload(data);
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Order Detail</h3>
        <button type="button" onClick={onClose} className="rounded-md border border-border px-2 py-1 text-xs">
          Close
        </button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading order details...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error && payload?.order ? (
        <div className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <span className="font-medium">Order:</span> {payload.order.id}
            </p>
            <p>
              <span className="font-medium">Customer:</span> {payload.order.customer_email}
            </p>
            <p>
              <span className="font-medium">Status:</span> {payload.order.status}
            </p>
            <p>
              <span className="font-medium">Created:</span> {new Date(payload.order.created_at).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Subtotal:</span> ${(payload.order.subtotal_cents / 100).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Total:</span> ${(payload.order.total_cents / 100).toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Items</h4>
            <ul className="space-y-2">
              {(payload.items ?? []).map((item) => (
                <li key={item.id} className="rounded-md border border-border bg-background px-3 py-2">
                  <p className="font-medium">{item.products?.title ?? item.product_id}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty {item.quantity} x ${(item.unit_price_cents / 100).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
