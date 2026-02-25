import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit/log";
import { enforceTrustedOrigin } from "@/lib/security/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createProductSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(1),
  sku: z.string().max(120).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isFeatured: z.boolean().optional().default(false),
  priceCents: z.number().int().nonnegative(),
  inventoryQty: z.number().int().nonnegative().default(0)
});

const updateProductSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  sku: z.string().max(120).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  isFeatured: z.boolean().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  inventoryQty: z.number().int().nonnegative().optional(),
  status: z.enum(["draft", "active", "archived"]).optional()
});

async function resolveOwnedStoreId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (storeError) {
    return { error: NextResponse.json({ error: storeError.message }, { status: 500 }) } as const;
  }

  if (!store) {
    return { error: NextResponse.json({ error: "No store found for account" }, { status: 404 }) } as const;
  }

  return { supabase, storeId: store.id, userId: user.id } as const;
}

export async function GET() {
  const resolved = await resolveOwnedStoreId();

  if ("error" in resolved) {
    return resolved.error;
  }

  const { data, error } = await resolved.supabase
    .from("products")
    .select("id,title,description,sku,image_url,is_featured,price_cents,inventory_qty,status")
    .eq("store_id", resolved.storeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}

export async function POST(request: NextRequest) {
  const trustedOriginResponse = enforceTrustedOrigin(request);

  if (trustedOriginResponse) {
    return trustedOriginResponse;
  }

  const payload = createProductSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const resolved = await resolveOwnedStoreId();

  if ("error" in resolved) {
    return resolved.error;
  }

  const { supabase } = resolved;
  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: resolved.storeId,
      title: payload.data.title,
      description: payload.data.description,
      sku: payload.data.sku ?? null,
      image_url: payload.data.imageUrl ?? null,
      is_featured: payload.data.isFeatured,
      price_cents: payload.data.priceCents,
      inventory_qty: payload.data.inventoryQty,
      status: "draft"
    })
    .select("id,title,description,sku,image_url,is_featured,price_cents,inventory_qty,status,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent({
    storeId: resolved.storeId,
    actorUserId: resolved.userId,
    action: "create",
    entity: "product",
    entityId: data.id,
    metadata: {
      title: data.title,
      priceCents: data.price_cents,
      status: data.status
    }
  });

  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const trustedOriginResponse = enforceTrustedOrigin(request);

  if (trustedOriginResponse) {
    return trustedOriginResponse;
  }

  const payload = updateProductSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const resolved = await resolveOwnedStoreId();

  if ("error" in resolved) {
    return resolved.error;
  }

  const updates: Record<string, unknown> = {};

  if (payload.data.title !== undefined) updates.title = payload.data.title;
  if (payload.data.description !== undefined) updates.description = payload.data.description;
  if (payload.data.sku !== undefined) updates.sku = payload.data.sku;
  if (payload.data.imageUrl !== undefined) updates.image_url = payload.data.imageUrl;
  if (payload.data.isFeatured !== undefined) updates.is_featured = payload.data.isFeatured;
  if (payload.data.priceCents !== undefined) updates.price_cents = payload.data.priceCents;
  if (payload.data.inventoryQty !== undefined) updates.inventory_qty = payload.data.inventoryQty;
  if (payload.data.status !== undefined) updates.status = payload.data.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await resolved.supabase
    .from("products")
    .update(updates)
    .eq("id", payload.data.productId)
    .eq("store_id", resolved.storeId)
    .select("id,title,description,sku,image_url,is_featured,price_cents,inventory_qty,status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditEvent({
    storeId: resolved.storeId,
    actorUserId: resolved.userId,
    action: "update",
    entity: "product",
    entityId: payload.data.productId,
    metadata: updates
  });

  return NextResponse.json({ product: data });
}
