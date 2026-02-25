import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Expected 6-digit hex color");

const brandingSchema = z.object({
  logoPath: z.string().max(500).nullable().optional(),
  primaryColor: hexColor.nullable().optional(),
  accentColor: hexColor.nullable().optional()
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

  return NextResponse.json({ branding: bundle.branding });
}

export async function PUT(request: NextRequest) {
  const payload = brandingSchema.safeParse(await request.json());

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

  const themeJson = {
    primaryColor: payload.data.primaryColor ?? null,
    accentColor: payload.data.accentColor ?? null
  };

  const { data, error } = await supabase
    .from("store_branding")
    .upsert(
      {
        store_id: bundle.store.id,
        logo_path: payload.data.logoPath ?? null,
        primary_color: payload.data.primaryColor ?? null,
        accent_color: payload.data.accentColor ?? null,
        theme_json: themeJson
      },
      { onConflict: "store_id" }
    )
    .select("store_id,logo_path,primary_color,accent_color,theme_json")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ branding: data });
}
