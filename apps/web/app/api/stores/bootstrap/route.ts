import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidStoreSlug, normalizeStoreSlug } from "@/lib/stores/slug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  storeName: z.string().min(2),
  slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/)
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const userClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const normalizedSlug = normalizeStoreSlug(payload.data.slug);

  if (!isValidStoreSlug(normalizedSlug)) {
    return NextResponse.json({ error: "Invalid store slug" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_user_id: user.id,
      name: payload.data.storeName,
      slug: normalizedSlug,
      status: "draft"
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Store slug is already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ store: data }, { status: 201 });
}
