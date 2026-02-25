import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
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
  const rateLimitResponse = checkRateLimit(request, {
    key: "checkout",
    limit: 20,
    windowMs: 60_000
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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

  const rpcItems = [...aggregatedItems.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  const { data, error } = await supabase.rpc("stub_checkout_create_paid_order", {
    p_store_slug: storeSlug,
    p_customer_email: email,
    p_items: rpcItems,
    p_stub_payment_ref: `stub_pi_${Date.now()}`,
    p_promo_code: promoCode ? promoCode.toUpperCase() : null
  });

  if (error) {
    const message = error.message || "Unable to complete checkout.";
    if (message.includes("Store not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (
      message.includes("Insufficient inventory") ||
      message.includes("unavailable") ||
      message.includes("Promo")
    ) {
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
