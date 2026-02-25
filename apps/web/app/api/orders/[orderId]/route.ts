import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  orderId: z.string().uuid()
});

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bundle = await getOwnedStoreBundle(user.id);

  if (!bundle) {
    return NextResponse.json({ error: "No store found for account" }, { status: 404 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,customer_email,subtotal_cents,total_cents,status,platform_fee_bps,platform_fee_cents,currency,created_at")
    .eq("id", params.data.orderId)
    .eq("store_id", bundle.store.id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("id,product_id,quantity,unit_price_cents,products(title)")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ order, items: items ?? [] });
}
