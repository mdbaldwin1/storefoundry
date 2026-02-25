"use client";

import { useMemo, useState } from "react";

type StorefrontProduct = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  inventory_qty: number;
};

type StorefrontPageProps = {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  branding: {
    logo_path: string | null;
    primary_color: string | null;
    accent_color: string | null;
  } | null;
  products: StorefrontProduct[];
};

type CartEntry = {
  productId: string;
  quantity: number;
};

type CheckoutResponse = {
  orderId?: string;
  totalCents?: number;
  paymentMode?: string;
  error?: string;
};

export function StorefrontPage({ store, branding, products }: StorefrontPageProps) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const cartItems = useMemo(() => {
    return cart
      .map((entry) => {
        const product = products.find((item) => item.id === entry.productId);
        if (!product) {
          return null;
        }

        return { ...entry, product };
      })
      .filter((item): item is { productId: string; quantity: number; product: StorefrontProduct } => item !== null);
  }, [cart, products]);

  const subtotalCents = cartItems.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);

  function addToCart(productId: string) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: Math.min(item.quantity + 1, 99) } : item
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }

    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity: Math.min(quantity, 99) } : item))
    );
  }

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cartItems.length === 0) {
      setError("Add at least one product to cart.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccessMessage(null);

    const response = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        email,
        items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity }))
      })
    });

    const payload = (await response.json()) as CheckoutResponse;

    setPending(false);

    if (!response.ok || !payload.orderId) {
      setError(payload.error ?? "Checkout failed.");
      return;
    }

    setCart([]);
    setSuccessMessage(`Order ${payload.orderId} placed. Paid via ${payload.paymentMode ?? "stub"}.`);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <section className="rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Storefront</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">{store.name}</h1>
            <p className="text-sm text-muted-foreground">{store.slug}.storefoundry.app</p>
          </div>
          <div className="flex h-12 min-w-12 items-center justify-center rounded-full border border-border bg-muted px-2 text-xs font-semibold">
            {store.name.slice(0, 2).toUpperCase()}
          </div>
        </div>
        {branding?.logo_path ? <p className="mt-2 text-xs text-muted-foreground">Logo URL: {branding.logo_path}</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Products</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.length === 0 ? (
              <p className="rounded-md border border-border bg-card/80 p-4 text-sm text-muted-foreground">No products available yet.</p>
            ) : (
              products.map((product) => (
                <article key={product.id} className="space-y-3 rounded-md border border-border bg-card/80 p-4 shadow-sm">
                  <div>
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">${(product.price_cents / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Stock: {product.inventory_qty}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(product.id)}
                    disabled={product.inventory_qty <= 0}
                    className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {product.inventory_qty <= 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-3 rounded-md border border-border bg-card/80 p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Cart</h2>
          {cartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="space-y-2">
              {cartItems.map((item) => (
                <li key={item.productId} className="space-y-1 rounded-md border border-border bg-muted/35 p-2">
                  <p className="text-sm font-medium">{item.product.title}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                      className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">${((item.product.price_cents * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm font-medium">Subtotal: ${(subtotalCents / 100).toFixed(2)}</p>
          <form onSubmit={checkout} className="space-y-2">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={pending || cartItems.length === 0}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {pending ? "Processing..." : "Checkout"}
            </button>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        </aside>
      </section>
    </main>
  );
}
