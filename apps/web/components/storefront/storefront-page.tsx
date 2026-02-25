"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildStorefrontThemeStyle } from "@/lib/theme/storefront-theme";

type StorefrontProduct = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
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
  settings: {
    support_email: string | null;
    fulfillment_message: string | null;
    shipping_policy: string | null;
    return_policy: string | null;
    announcement: string | null;
  } | null;
  contentBlocks: Array<{
    id: string;
    sort_order: number;
    eyebrow: string | null;
    title: string;
    body: string;
    cta_label: string | null;
    cta_url: string | null;
    is_active: boolean;
  }>;
  products: StorefrontProduct[];
};

type CartEntry = {
  productId: string;
  quantity: number;
};

type CheckoutResponse = {
  orderId?: string;
  totalCents?: number;
  discountCents?: number;
  promoCode?: string | null;
  paymentMode?: string;
  error?: string;
};

type PromoPreviewResponse = {
  promoCode?: string;
  discountCents?: number;
  discountedTotalCents?: number;
  error?: string;
};

export function StorefrontPage({ store, branding, settings, contentBlocks, products }: StorefrontPageProps) {
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appliedDiscountCents, setAppliedDiscountCents] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

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
  const storefrontThemeStyle = buildStorefrontThemeStyle({
    primaryColor: branding?.primary_color,
    accentColor: branding?.accent_color
  });

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

  async function applyPromoPreview() {
    if (!promoCode.trim()) {
      setAppliedDiscountCents(0);
      setAppliedPromoCode(null);
      return;
    }

    setApplyingPromo(true);
    setError(null);

    const response = await fetch("/api/promotions/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        promoCode: promoCode.trim(),
        subtotalCents
      })
    });

    const payload = (await response.json()) as PromoPreviewResponse;
    setApplyingPromo(false);

    if (!response.ok || payload.discountCents === undefined) {
      setAppliedDiscountCents(0);
      setAppliedPromoCode(null);
      setError(payload.error ?? "Unable to apply promo code.");
      return;
    }

    setAppliedPromoCode(payload.promoCode ?? promoCode.trim().toUpperCase());
    setAppliedDiscountCents(payload.discountCents);
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
        promoCode: promoCode.trim() || undefined,
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
    setPromoCode("");
    setAppliedDiscountCents(0);
    setAppliedPromoCode(null);
    setSuccessMessage(`Order ${payload.orderId} placed. Paid via ${payload.paymentMode ?? "stub"}.`);
  }

  return (
    <main style={storefrontThemeStyle} className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {settings?.announcement ? (
          <div className="bg-[var(--storefront-accent)] px-4 py-2 text-center text-xs font-medium text-white">
            {settings.announcement}
          </div>
        ) : null}
        <div className="grid gap-6 bg-gradient-to-r from-[var(--storefront-primary)]/20 via-background to-[var(--storefront-accent)]/20 p-6 sm:p-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Small-Batch Storefront</p>
            <h1 className="text-4xl font-semibold leading-tight">{store.name}</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              Handmade essentials crafted in small batches. Transparent ingredients, direct-from-maker quality, and fast checkout.
            </p>
            {settings?.fulfillment_message ? <p className="text-sm font-medium text-foreground">{settings.fulfillment_message}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-border bg-background px-3 py-1">Natural ingredients</span>
              <span className="rounded-full border border-border bg-background px-3 py-1">Made to order</span>
              <span className="rounded-full border border-border bg-background px-3 py-1">Direct support</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/80 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Store Link</p>
            <p className="mt-1 break-all text-sm font-medium">{store.slug}.myrivo.app</p>
            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
            {branding?.logo_path ? <p className="mt-3 text-xs text-muted-foreground">Logo: {branding.logo_path}</p> : null}
          </div>
        </div>
      </section>
      {(settings?.shipping_policy || settings?.return_policy || settings?.support_email) && (
        <section className="grid gap-3 rounded-xl border border-border bg-card/80 p-4 md:grid-cols-3">
          <article className="space-y-1 rounded-md border border-border bg-background px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shipping</h3>
            <p className="text-sm">{settings?.shipping_policy || "Shipping policy coming soon."}</p>
          </article>
          <article className="space-y-1 rounded-md border border-border bg-background px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Returns</h3>
            <p className="text-sm">{settings?.return_policy || "Return policy coming soon."}</p>
          </article>
          <article className="space-y-1 rounded-md border border-border bg-background px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support</h3>
            <p className="text-sm">{settings?.support_email || "Contact details coming soon."}</p>
          </article>
        </section>
      )}
      {contentBlocks.filter((block) => block.is_active).length > 0 ? (
        <section className="grid gap-3 md:grid-cols-2">
          {contentBlocks
            .filter((block) => block.is_active)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((block) => (
              <article key={block.id} className="rounded-xl border border-border bg-card/80 p-4 shadow-sm">
                {block.eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.eyebrow}</p> : null}
                <h3 className="mt-1 text-lg font-semibold">{block.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{block.body}</p>
                {block.cta_label && block.cta_url ? (
                  <a href={block.cta_url} className="mt-3 inline-flex rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted/40">
                    {block.cta_label}
                  </a>
                ) : null}
              </article>
            ))}
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Featured Products</h2>
            <p className="text-xs text-muted-foreground">{products.length} available</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {products.length === 0 ? (
              <p className="rounded-md border border-border bg-card/80 p-4 text-sm text-muted-foreground">No products available yet.</p>
            ) : (
              products.map((product) => (
                <article key={product.id} className="space-y-3 rounded-md border border-border bg-card/80 p-4 shadow-sm">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={`${product.title} image`}
                      width={640}
                      height={320}
                      unoptimized
                      className="h-40 w-full rounded-md border border-border object-cover"
                    />
                  ) : null}
                  <div>
                    <h3 className="font-semibold">{product.title}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">${(product.price_cents / 100).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Stock: {product.inventory_qty}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => addToCart(product.id)}
                    disabled={product.inventory_qty <= 0}
                    className="w-full bg-[var(--storefront-primary)] text-white hover:opacity-90"
                  >
                    {product.inventory_qty <= 0 ? "Out of stock" : "Add to cart"}
                  </Button>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="space-y-3 rounded-xl border border-border bg-card/90 p-4 shadow-sm">
          <h2 className="text-xl font-semibold">Cart</h2>
          {cartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <ul className="space-y-2">
              {cartItems.map((item) => (
                <li key={item.productId} className="space-y-1 rounded-md border border-border bg-muted/35 p-2">
                  <p className="text-sm font-medium">{item.product.title}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                      className="h-8 w-20 px-2 py-1"
                    />
                    <p className="text-xs text-muted-foreground">${((item.product.price_cents * item.quantity) / 100).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-md border border-border bg-muted/25 p-2 text-sm">
            <p className="font-medium">Subtotal: ${(subtotalCents / 100).toFixed(2)}</p>
            {appliedDiscountCents > 0 ? (
              <p className="text-xs text-emerald-700">
                Discount applied: -${(appliedDiscountCents / 100).toFixed(2)}
                {appliedPromoCode ? ` (${appliedPromoCode})` : ""}
              </p>
            ) : null}
            <p className="text-xs font-medium">
              Estimated total: ${((subtotalCents - appliedDiscountCents) / 100).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Payment is running in protected test mode.</p>
          </div>
          <form onSubmit={checkout} className="space-y-2">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              type="text"
              placeholder="Promo code (optional)"
              value={promoCode}
              onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
            />
            <Button
              type="button"
              onClick={() => void applyPromoPreview()}
              disabled={applyingPromo || !promoCode.trim()}
              variant="outline"
              className="w-full"
            >
              {applyingPromo ? "Applying..." : "Apply promo"}
            </Button>
            <Button
              type="submit"
              disabled={pending || cartItems.length === 0}
              className="w-full bg-[var(--storefront-accent)] text-white hover:opacity-90"
            >
              {pending ? "Processing..." : "Checkout"}
            </Button>
          </form>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        </aside>
      </section>
    </main>
  );
}
