"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ProductRecord } from "@/types/database";

type ProductManagerProps = {
  initialProducts: Array<
    Pick<
      ProductRecord,
      "id" | "title" | "description" | "sku" | "image_url" | "is_featured" | "price_cents" | "inventory_qty" | "status" | "created_at"
    >
  >;
};

type ProductListItem = Pick<
  ProductRecord,
  "id" | "title" | "description" | "sku" | "image_url" | "is_featured" | "price_cents" | "inventory_qty" | "status" | "created_at"
>;

type ProductResponse = {
  product?: ProductListItem;
  products?: ProductListItem[];
  error?: string;
};

const statusOptions: Array<ProductRecord["status"]> = ["draft", "active", "archived"];

export function ProductManager({ initialProducts }: ProductManagerProps) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProductRecord["status"]>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [priceDollars, setPriceDollars] = useState("0.00");
  const [inventoryQty, setInventoryQty] = useState("0");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const activeCount = products.filter((product) => product.status === "active").length;
    const lowStockCount = products.filter((product) => product.inventory_qty < 10).length;
    return { activeCount, lowStockCount, total: products.length };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        product.title.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [products, query, statusFilter]);

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const priceCents = Math.round(Number(priceDollars) * 100);
    const inventory = Number(inventoryQty);

    if (Number.isNaN(priceCents) || priceCents < 0 || Number.isNaN(inventory) || inventory < 0) {
      setError("Price and inventory must be non-negative numbers.");
      setPending(false);
      return;
    }

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        sku: sku.trim() || null,
        imageUrl: imageUrl.trim() || null,
        isFeatured,
        priceCents,
        inventoryQty: inventory
      })
    });

    const payload = (await response.json()) as ProductResponse;

    if (!response.ok || !payload.product) {
      setError(payload.error ?? "Unable to create product.");
      setPending(false);
      return;
    }

    const createdProduct = payload.product;
    setProducts((current) => [createdProduct, ...current]);
    setTitle("");
    setDescription("");
    setSku("");
    setImageUrl("");
    setIsFeatured(false);
    setPriceDollars("0.00");
    setInventoryQty("0");
    setPending(false);
  }

  async function updateProduct(
    productId: string,
    patch: {
      inventory_qty?: number;
      status?: ProductRecord["status"];
      is_featured?: boolean;
      image_url?: string | null;
    }
  ) {
    setError(null);

    const response = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        inventoryQty: patch.inventory_qty,
        status: patch.status,
        isFeatured: patch.is_featured,
        imageUrl: patch.image_url
      })
    });

    const payload = (await response.json()) as ProductResponse;

    if (!response.ok || !payload.product) {
      setError(payload.error ?? "Unable to update product.");
      return;
    }

    setProducts((current) =>
      current.map((product) => {
        if (product.id !== productId) return product;
        return { ...product, ...payload.product };
      })
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Catalog and Inventory</h2>
        <p className="text-sm text-muted-foreground">Add products, track stock, and update listing status.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find product"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | ProductRecord["status"])}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-muted/45 px-3 py-2 text-sm">Total products: {stats.total}</div>
          <div className="rounded-md border border-border bg-muted/45 px-3 py-2 text-sm">Active: {stats.activeCount}</div>
          <div className="rounded-md border border-border bg-muted/45 px-3 py-2 text-sm">Low stock (&lt;10): {stats.lowStockCount}</div>
        </div>
      </header>

      <form onSubmit={createProduct} className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Title</span>
          <input
            required
            minLength={2}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            required
            minLength={1}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">SKU</span>
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Image URL</span>
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Price (USD)</span>
          <input
            required
            inputMode="decimal"
            value={priceDollars}
            onChange={(event) => setPriceDollars(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Inventory qty</span>
          <input
            required
            inputMode="numeric"
            value={inventoryQty}
            onChange={(event) => setInventoryQty(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
          <span className="text-sm font-medium">Featured product</span>
        </label>
        {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
        <button
          disabled={pending}
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:col-span-2"
        >
          {pending ? "Saving..." : "Add product"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/45">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Inventory</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={5}>
                  No products match this filter.
                </td>
              </tr>
            ) : (
              visibleProducts.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="flex items-start gap-2">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={`${product.title} preview`}
                          width={40}
                          height={40}
                          unoptimized
                          className="h-10 w-10 rounded-md border border-border object-cover"
                        />
                      ) : null}
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-xs text-muted-foreground">{product.sku ? `SKU: ${product.sku}` : "No SKU"}</p>
                        <p className="text-xs text-muted-foreground">{product.description}</p>
                        {product.is_featured ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            featured
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={product.status}
                      onChange={(event) =>
                        void updateProduct(product.id, { status: event.target.value as ProductRecord["status"] })
                      }
                      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">${(product.price_cents / 100).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <input
                      inputMode="numeric"
                      value={String(product.inventory_qty)}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isNaN(next) || next < 0) return;
                        setProducts((current) =>
                          current.map((item) => (item.id === product.id ? { ...item, inventory_qty: next } : item))
                        );
                      }}
                      onBlur={() => void updateProduct(product.id, { inventory_qty: product.inventory_qty })}
                      className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void updateProduct(product.id, {
                            status: product.status === "archived" ? "draft" : "archived"
                          })
                        }
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium"
                      >
                        {product.status === "archived" ? "Unarchive" : "Archive"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateProduct(product.id, { inventory_qty: product.inventory_qty + 10 })}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium"
                      >
                        +10 stock
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateProduct(product.id, { is_featured: !product.is_featured })}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium"
                      >
                        {product.is_featured ? "Unfeature" : "Feature"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
