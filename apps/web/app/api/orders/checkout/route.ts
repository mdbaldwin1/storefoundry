import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlanConfig } from "@/config/pricing";
import { calculateOrderTotals } from "@/lib/orders/calculate-order-totals";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(99)
});

const payloadSchema = z.object({
  storeSlug: z.string().min(3),
  email: z.string().email(),
  items: z.array(itemSchema).min(1)
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { storeSlug, email, items } = payload.data;
  const aggregatedItems = new Map<string, number>();

  for (const item of items) {
    aggregatedItems.set(item.productId, (aggregatedItems.get(item.productId) ?? 0) + item.quantity);
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,slug,status")
    .eq("slug", storeSlug)
    .eq("status", "active")
    .maybeSingle();

  if (storeError) {
    return NextResponse.json({ error: storeError.message }, { status: 500 });
  }

  if (!store) {
    return NextResponse.json({ error: "Store not found or inactive" }, { status: 404 });
  }

  const productIds = [...aggregatedItems.keys()];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,title,price_cents,inventory_qty,status")
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
      return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });
    }

    if (product.inventory_qty < quantity) {
      return NextResponse.json(
        { error: `Insufficient inventory for ${product.title}. Available: ${product.inventory_qty}` },
        { status: 400 }
      );
    }

    subtotalCents += product.price_cents * quantity;
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan_key,platform_fee_bps,status")
    .eq("store_id", store.id)
    .maybeSingle();

  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  const fallbackPlan = getPlanConfig("free");
  const feeBps = subscription?.status === "active" ? subscription.platform_fee_bps : fallbackPlan.platformFeeBps;
  const totals = calculateOrderTotals(subtotalCents, feeBps);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      store_id: store.id,
      customer_email: email,
      subtotal_cents: totals.subtotalCents,
      total_cents: totals.totalCents,
      status: "paid",
      platform_fee_bps: totals.platformFeeBps,
      platform_fee_cents: totals.platformFeeCents,
      stripe_payment_intent_id: `stub_pi_${Date.now()}`
    })
    .select("id,status,total_cents,platform_fee_cents")
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const orderItems = [...aggregatedItems.entries()].map(([productId, quantity]) => {
    const product = productMap.get(productId);
    if (!product) {
      throw new Error("Invariant: missing product");
    }

    return {
      order_id: order.id,
      product_id: productId,
      quantity,
      unit_price_cents: product.price_cents
    };
  });

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  for (const [productId, quantity] of aggregatedItems.entries()) {
    const product = productMap.get(productId);

    if (!product) {
      return NextResponse.json({ error: "Product map mismatch" }, { status: 500 });
    }

    const nextInventory = product.inventory_qty - quantity;
    const { error: inventoryError } = await supabase
      .from("products")
      .update({ inventory_qty: nextInventory })
      .eq("id", product.id)
      .eq("inventory_qty", product.inventory_qty)
      .eq("store_id", store.id);

    if (inventoryError) {
      return NextResponse.json({ error: inventoryError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    orderId: order.id,
    status: order.status,
    totalCents: order.total_cents,
    platformFeeCents: order.platform_fee_cents,
    paymentMode: "stub"
  });
}
