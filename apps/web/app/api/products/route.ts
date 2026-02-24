import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createProductSchema = z.object({
  storeId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  inventoryQty: z.number().int().nonnegative().default(0)
});

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("id,title,description,price_cents,inventory_qty,status")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}

export async function POST(request: NextRequest) {
  const payload = createProductSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: payload.data.storeId,
      title: payload.data.title,
      description: payload.data.description,
      price_cents: payload.data.priceCents,
      inventory_qty: payload.data.inventoryQty,
      status: "draft"
    })
    .select("id,title,status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product: data }, { status: 201 });
}
