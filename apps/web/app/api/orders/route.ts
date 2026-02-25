import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";

const updateSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "paid", "failed", "cancelled"])
});

export async function GET() {
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

  const { data, error } = await supabase
    .from("orders")
    .select("id,customer_email,subtotal_cents,total_cents,status,platform_fee_cents,created_at")
    .eq("store_id", bundle.store.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const payload = updateSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
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

  const { data, error } = await supabase
    .from("orders")
    .update({ status: payload.data.status })
    .eq("id", payload.data.orderId)
    .eq("store_id", bundle.store.id)
    .select("id,customer_email,subtotal_cents,total_cents,status,platform_fee_cents,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}
