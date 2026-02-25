import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";

const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

const createDomainSchema = z.object({
  domain: z.string().toLowerCase().trim().regex(domainPattern, "Invalid domain format"),
  isPrimary: z.boolean().optional().default(false)
});

const deleteDomainSchema = z.object({
  domainId: z.string().uuid()
});

const updateDomainSchema = z.object({
  domainId: z.string().uuid(),
  isPrimary: z.boolean().optional(),
  verificationStatus: z.enum(["pending", "verified", "failed"]).optional()
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

  return NextResponse.json({ domains: bundle.domains });
}

export async function POST(request: NextRequest) {
  const payload = createDomainSchema.safeParse(await request.json());

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

  if (payload.data.isPrimary) {
    await supabase.from("store_domains").update({ is_primary: false }).eq("store_id", bundle.store.id);
  }

  const { data, error } = await supabase
    .from("store_domains")
    .insert({
      store_id: bundle.store.id,
      domain: payload.data.domain,
      is_primary: payload.data.isPrimary,
      verification_status: "pending"
    })
    .select("id,domain,is_primary,verification_status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Domain already attached to a store" }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const payload = updateDomainSchema.safeParse(await request.json());

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

  const domain = bundle.domains.find((item) => item.id === payload.data.domainId);

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  if (payload.data.isPrimary === true) {
    await supabase.from("store_domains").update({ is_primary: false }).eq("store_id", bundle.store.id);
  }

  const updates: Record<string, unknown> = {};

  if (payload.data.isPrimary !== undefined) {
    updates.is_primary = payload.data.isPrimary;
  }

  if (payload.data.verificationStatus !== undefined) {
    updates.verification_status = payload.data.verificationStatus;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("store_domains")
    .update(updates)
    .eq("id", payload.data.domainId)
    .eq("store_id", bundle.store.id)
    .select("id,domain,is_primary,verification_status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: data });
}

export async function DELETE(request: NextRequest) {
  const payload = deleteDomainSchema.safeParse(await request.json());

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

  const { error } = await supabase
    .from("store_domains")
    .delete()
    .eq("id", payload.data.domainId)
    .eq("store_id", bundle.store.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
