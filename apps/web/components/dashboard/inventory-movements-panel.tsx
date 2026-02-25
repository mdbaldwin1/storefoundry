"use client";

import { useEffect, useState } from "react";

type InventoryMovement = {
  id: string;
  product_id: string;
  order_id: string | null;
  delta_qty: number;
  reason: "sale" | "restock" | "adjustment";
  note: string | null;
  created_at: string;
  products?: { title?: string } | null;
};

type InventoryMovementsResponse = {
  movements?: InventoryMovement[];
  error?: string;
};

export function InventoryMovementsPanel() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMovements() {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/inventory/movements");
      const payload = (await response.json()) as InventoryMovementsResponse;

      if (!active) {
        return;
      }

      setLoading(false);

      if (!response.ok || !payload.movements) {
        setError(payload.error ?? "Unable to load inventory movements.");
        return;
      }

      setMovements(payload.movements);
    }

    void loadMovements();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
      <header>
        <h3 className="text-lg font-semibold">Inventory Ledger</h3>
        <p className="text-xs text-muted-foreground">Last 50 inventory movements for audit and support workflows.</p>
      </header>

      {loading ? <p className="text-sm text-muted-foreground">Loading ledger...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <ul className="space-y-2">
          {movements.length === 0 ? (
            <li className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">No inventory events yet.</li>
          ) : (
            movements.map((movement) => (
              <li key={movement.id} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{movement.products?.title ?? movement.product_id}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      movement.delta_qty < 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {movement.delta_qty > 0 ? `+${movement.delta_qty}` : movement.delta_qty}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">{movement.reason}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(movement.created_at).toLocaleString()}
                  {movement.order_id ? ` • order ${movement.order_id}` : ""}
                  {movement.note ? ` • ${movement.note}` : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </section>
  );
}
