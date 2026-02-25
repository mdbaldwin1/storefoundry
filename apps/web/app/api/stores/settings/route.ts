import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";

const settingsSchema = z.object({
  supportEmail: z.string().email().nullable().optional(),
  fulfillmentMessage: z.string().max(240).nullable().optional(),
  shippingPolicy: z.string().max(2000).nullable().optional(),
  returnPolicy: z.string().max(2000).nullable().optional(),
  announcement: z.string().max(300).nullable().optional()
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

  return NextResponse.json({ settings: bundle.settings });
}

export async function PUT(request: NextRequest) {
  const payload = settingsSchema.safeParse(await request.json());

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
    .from("store_settings")
    .upsert(
      {
        store_id: bundle.store.id,
        support_email: payload.data.supportEmail ?? null,
        fulfillment_message: payload.data.fulfillmentMessage ?? null,
        shipping_policy: payload.data.shippingPolicy ?? null,
        return_policy: payload.data.returnPolicy ?? null,
        announcement: payload.data.announcement ?? null
      },
      { onConflict: "store_id" }
    )
    .select("support_email,fulfillment_message,shipping_policy,return_policy,announcement")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
