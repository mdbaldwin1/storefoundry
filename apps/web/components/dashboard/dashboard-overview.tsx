import { ProductManager } from "@/components/dashboard/product-manager";
import { ProductRecord, StoreRecord } from "@/types/database";

type DashboardOverviewProps = {
  store: Pick<StoreRecord, "id" | "name" | "slug" | "status">;
  products: Array<
    Pick<ProductRecord, "id" | "title" | "description" | "price_cents" | "inventory_qty" | "status" | "created_at">
  >;
};

export function DashboardOverview({ store, products }: DashboardOverviewProps) {
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
      <div className="rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <ProductManager initialProducts={products} />
      </div>
    </section>
  );
}
