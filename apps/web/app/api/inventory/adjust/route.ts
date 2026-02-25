import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit/log";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  productId: z.string().uuid(),
  deltaQty: z.number().int().refine((value) => value !== 0),
  reason: z.enum(["restock", "adjustment"]),
  note: z.string().max(280).nullable().optional()
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

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

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,inventory_qty,title")
    .eq("id", payload.data.productId)
    .eq("store_id", bundle.store.id)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const nextInventory = product.inventory_qty + payload.data.deltaQty;

  if (nextInventory < 0) {
    return NextResponse.json({ error: "Inventory adjustment cannot make stock negative." }, { status: 400 });
  }

  const { data: updatedProduct, error: updateError } = await supabase
    .from("products")
    .update({ inventory_qty: nextInventory })
    .eq("id", product.id)
    .eq("store_id", bundle.store.id)
    .select("id,title,description,sku,image_url,is_featured,price_cents,inventory_qty,status,created_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    store_id: bundle.store.id,
    product_id: product.id,
    delta_qty: payload.data.deltaQty,
    reason: payload.data.reason,
    note: payload.data.note ?? null
  });

  if (movementError) {
    return NextResponse.json({ error: movementError.message }, { status: 500 });
  }

  await logAuditEvent({
    storeId: bundle.store.id,
    actorUserId: user.id,
    action: "adjust",
    entity: "inventory",
    entityId: product.id,
    metadata: {
      reason: payload.data.reason,
      deltaQty: payload.data.deltaQty,
      nextInventory
    }
  });

  return NextResponse.json({ product: updatedProduct });
}
