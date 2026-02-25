"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";

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
    fulfillment_status: string;
    fulfilled_at: string | null;
    shipped_at: string | null;
    platform_fee_bps: number;
    platform_fee_cents: number;
    discount_cents: number;
    promo_code: string | null;
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

  function orderTone(status: string) {
    if (status === "paid" || status === "fulfilled" || status === "shipped") return "success" as const;
    if (status === "failed" || status === "cancelled") return "danger" as const;
    if (status === "processing") return "info" as const;
    return "warning" as const;
  }

  return (
    <Card className="bg-muted/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg">Order Detail</CardTitle>
        <Button type="button" onClick={onClose} variant="outline" size="sm" className="h-7 text-xs">
          Close
        </Button>
      </CardHeader>
      <CardContent>

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
              <span className="font-medium">Status:</span> <StatusChip label={payload.order.status} tone={orderTone(payload.order.status)} />
            </p>
            <p>
              <span className="font-medium">Fulfillment:</span>{" "}
              <StatusChip label={payload.order.fulfillment_status} tone={orderTone(payload.order.fulfillment_status)} />
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
            <p>
              <span className="font-medium">Discount:</span> ${(payload.order.discount_cents / 100).toFixed(2)}
            </p>
            <p>
              <span className="font-medium">Promo:</span> {payload.order.promo_code ?? "none"}
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
      </CardContent>
    </Card>
  );
}
