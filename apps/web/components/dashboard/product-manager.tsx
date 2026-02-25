"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataStat } from "@/components/ui/data-stat";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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

  async function adjustInventory(productId: string, deltaQty: number, reason: "restock" | "adjustment", note?: string) {
    setError(null);

    const response = await fetch("/api/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, deltaQty, reason, note: note ?? null })
    });

    const payload = (await response.json()) as ProductResponse;

    if (!response.ok || !payload.product) {
      setError(payload.error ?? "Unable to adjust inventory.");
      return;
    }

    setProducts((current) =>
      current.map((product) => {
        if (product.id !== productId) return product;
        return payload.product!;
      })
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold">Catalog and Inventory</h2>
        <p className="text-sm text-muted-foreground">Add products, track stock, and update listing status.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Search" labelClassName="text-xs uppercase tracking-wide text-muted-foreground">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find product" />
          </FormField>
          <FormField label="Status Filter" labelClassName="text-xs uppercase tracking-wide text-muted-foreground">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ProductRecord["status"])}>
              <option value="all">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <DataStat label="Total products" value={String(stats.total)} />
          <DataStat label="Active" value={String(stats.activeCount)} />
          <DataStat label="Low stock (<10)" value={String(stats.lowStockCount)} />
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createProduct} className="grid gap-3 sm:grid-cols-2">
            <FormField label="Title" className="sm:col-span-2">
              <Input required minLength={2} value={title} onChange={(event) => setTitle(event.target.value)} />
            </FormField>
            <FormField label="Description" className="sm:col-span-2">
              <Textarea required minLength={1} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </FormField>
            <FormField label="SKU">
              <Input value={sku} onChange={(event) => setSku(event.target.value)} />
            </FormField>
            <FormField label="Image URL">
              <Input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
            </FormField>
            <FormField label="Price (USD)">
              <Input required inputMode="decimal" value={priceDollars} onChange={(event) => setPriceDollars(event.target.value)} />
            </FormField>
            <FormField label="Inventory qty">
              <Input required inputMode="numeric" value={inventoryQty} onChange={(event) => setInventoryQty(event.target.value)} />
            </FormField>
            <label className="flex items-center gap-2 sm:col-span-2">
              <Checkbox checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
              <span className="text-sm font-medium">Featured product</span>
            </label>
            <FeedbackMessage type="error" message={error} className="sm:col-span-2" />
            <Button disabled={pending} type="submit" className="sm:col-span-2">
              {pending ? "Saving..." : "Add product"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader className="bg-muted/45">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProducts.length === 0 ? (
              <TableRow>
                <TableCell className="py-3 text-muted-foreground" colSpan={5}>
                  No products match this filter.
                </TableCell>
              </TableRow>
            ) : (
              visibleProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
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
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">featured</Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={product.status}
                      onChange={(event) =>
                        void updateProduct(product.id, { status: event.target.value as ProductRecord["status"] })
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>${(product.price_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
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
                      className="h-8 w-24 px-2 py-1"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          void updateProduct(product.id, {
                            status: product.status === "archived" ? "draft" : "archived"
                          })
                        }
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        {product.status === "archived" ? "Unarchive" : "Archive"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void adjustInventory(product.id, 10, "restock", "Quick restock +10")}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        +10 stock
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void adjustInventory(product.id, -1, "adjustment", "Quick decrement -1")}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        -1 stock
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void updateProduct(product.id, { is_featured: !product.is_featured })}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        {product.is_featured ? "Unfeature" : "Feature"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
