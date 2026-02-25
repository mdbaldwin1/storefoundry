import { ProductManager } from "@/components/dashboard/product-manager";
import { SubscriptionPlanSelector } from "@/components/dashboard/subscription-plan-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataStat } from "@/components/ui/data-stat";
import { OrderRecord, ProductRecord, StoreRecord } from "@/types/database";
import type { PlanKey, SubscriptionStatus } from "@/types/database";

type DashboardOverviewProps = {
  store: Pick<StoreRecord, "id" | "name" | "slug" | "status">;
  subscription: {
    plan_key: PlanKey;
    status: SubscriptionStatus;
    platform_fee_bps: number;
  } | null;
  recentOrders: Array<Pick<OrderRecord, "id" | "total_cents" | "status" | "created_at">>;
  products: Array<
    Pick<
      ProductRecord,
      "id" | "title" | "description" | "sku" | "image_url" | "is_featured" | "price_cents" | "inventory_qty" | "status" | "created_at"
    >
  >;
};

export function DashboardOverview({ store, products, recentOrders, subscription }: DashboardOverviewProps) {
  const lowStockProducts = products.filter((product) => product.inventory_qty < 10 && product.status !== "archived");
  const paidOrders = recentOrders.filter((order) => order.status === "paid");
  const revenueCents = paidOrders.reduce((sum, order) => sum + order.total_cents, 0);

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Overview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage catalog and inventory for <span className="font-medium text-foreground">{store.slug}</span>.
          </p>
        </CardHeader>
      </Card>
      <section className="grid gap-3 sm:grid-cols-3">
        <DataStat label="Recent Revenue" value={`$${(revenueCents / 100).toFixed(2)}`} className="bg-card" />
        <DataStat label="Recent Orders" value={String(recentOrders.length)} className="bg-card" />
        <DataStat label="Low Stock SKUs" value={String(lowStockProducts.length)} className="bg-card" />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Low Stock Alerts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lowStockProducts.length === 0 ? (
              <li className="text-muted-foreground">No low-stock alerts.</li>
            ) : (
              lowStockProducts.slice(0, 8).map((product) => (
                <li key={product.id} className="flex items-center justify-between rounded-md border border-border bg-muted/25 px-3 py-2">
                  <span>{product.title}</span>
                  <span className="text-xs text-muted-foreground">{product.inventory_qty} left</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentOrders.length === 0 ? (
              <li className="text-muted-foreground">No orders yet.</li>
            ) : (
              recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between rounded-md border border-border bg-muted/25 px-3 py-2">
                  <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
                  <span>${(order.total_cents / 100).toFixed(2)}</span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-xs">{order.status}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
      <Card>
        <CardContent className="p-6">
        <SubscriptionPlanSelector currentPlan={subscription?.plan_key ?? "free"} currentStatus={subscription?.status ?? "active"} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
        <ProductManager initialProducts={products} />
        </CardContent>
      </Card>
    </section>
  );
}
