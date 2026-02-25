import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateDiscountCents } from "@/lib/promotions/calculate-discount";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(99)
});

const payloadSchema = z.object({
  storeSlug: z.string().min(3),
  email: z.string().email(),
  promoCode: z.string().trim().min(3).max(40).optional(),
  items: z.array(itemSchema).min(1)
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { storeSlug, email, items, promoCode } = payload.data;
  const aggregatedItems = new Map<string, number>();

  for (const item of items) {
    aggregatedItems.set(item.productId, (aggregatedItems.get(item.productId) ?? 0) + item.quantity);
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", storeSlug)
    .eq("status", "active")
    .maybeSingle();

  if (storeError) {
    return NextResponse.json({ error: storeError.message }, { status: 500 });
  }

  if (!store) {
    return NextResponse.json({ error: "Store not found or inactive." }, { status: 404 });
  }

  const productIds = [...aggregatedItems.keys()];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,price_cents,status")
    .eq("store_id", store.id)
    .in("id", productIds)
    .eq("status", "active");

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }

  const productMap = new Map((products ?? []).map((product) => [product.id, product]));
  let subtotalCents = 0;

  for (const [productId, quantity] of aggregatedItems.entries()) {
    const product = productMap.get(productId);
    if (!product) {
      return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    }

    subtotalCents += product.price_cents * quantity;
  }

  let appliedPromoCode: string | null = null;
  let discountCents = 0;

  if (promoCode) {
    const normalizedCode = promoCode.toUpperCase();
    const now = Date.now();
    const { data: promotion, error: promotionError } = await supabase
      .from("promotions")
      .select("code,discount_type,discount_value,min_subtotal_cents,max_redemptions,times_redeemed,starts_at,ends_at,is_active")
      .eq("store_id", store.id)
      .eq("code", normalizedCode)
      .maybeSingle();

    if (promotionError) {
      return NextResponse.json({ error: promotionError.message }, { status: 500 });
    }

    if (!promotion) {
      return NextResponse.json({ error: "Promo code is invalid or inactive." }, { status: 400 });
    }

    if (!promotion.is_active) {
      return NextResponse.json({ error: "Promo code is inactive." }, { status: 400 });
    }

    if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) {
      return NextResponse.json({ error: "Promo code is not active yet." }, { status: 400 });
    }

    if (promotion.ends_at && new Date(promotion.ends_at).getTime() < now) {
      return NextResponse.json({ error: "Promo code has expired." }, { status: 400 });
    }

    if (subtotalCents < promotion.min_subtotal_cents) {
      return NextResponse.json(
        { error: `Promo requires minimum subtotal of $${(promotion.min_subtotal_cents / 100).toFixed(2)}.` },
        { status: 400 }
      );
    }

    if (promotion.max_redemptions !== null && promotion.times_redeemed >= promotion.max_redemptions) {
      return NextResponse.json({ error: "Promo code redemption limit reached." }, { status: 400 });
    }

    discountCents = calculateDiscountCents(subtotalCents, promotion);
    appliedPromoCode = promotion.code;
  }

  const rpcItems = [...aggregatedItems.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  const { data, error } = await supabase.rpc("stub_checkout_create_paid_order", {
    p_store_slug: storeSlug,
    p_customer_email: email,
    p_items: rpcItems,
    p_stub_payment_ref: `stub_pi_${Date.now()}`,
    p_discount_cents: discountCents,
    p_promo_code: appliedPromoCode
  });

  if (error) {
    const message = error.message || "Unable to complete checkout.";
    if (message.includes("Store not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes("Insufficient inventory") || message.includes("unavailable")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.order_id) {
    return NextResponse.json({ error: "Checkout did not return an order id." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: result.order_id,
    status: "paid",
    totalCents: result.total_cents,
    platformFeeCents: result.platform_fee_cents,
    discountCents: result.discount_cents,
    promoCode: result.promo_code,
    paymentMode: "stub"
  });
}
