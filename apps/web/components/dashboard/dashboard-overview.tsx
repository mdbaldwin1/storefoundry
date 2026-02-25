import { ProductManager } from "@/components/dashboard/product-manager";
import { SubscriptionPlanSelector } from "@/components/dashboard/subscription-plan-selector";
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
      <header className="rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <h1 className="text-3xl font-semibold">{store.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage catalog and inventory for <span className="font-medium text-foreground">{store.slug}</span>.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Store status: {store.status}
        </div>
      </header>
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent Revenue</p>
          <p className="mt-2 text-2xl font-semibold">${(revenueCents / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent Orders</p>
          <p className="mt-2 text-2xl font-semibold">{recentOrders.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low Stock SKUs</p>
          <p className="mt-2 text-2xl font-semibold">{lowStockProducts.length}</p>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
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
        <div className="rounded-lg border border-border bg-card/80 p-4 shadow-sm">
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
      <div className="rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <SubscriptionPlanSelector currentPlan={subscription?.plan_key ?? "free"} currentStatus={subscription?.status ?? "active"} />
      </div>
      <div className="rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <ProductManager initialProducts={products} />
      </div>
    </section>
  );
}
