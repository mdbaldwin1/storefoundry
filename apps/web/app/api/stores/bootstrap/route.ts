import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const payloadSchema = z.object({
  ownerUserId: z.string().uuid(),
  storeName: z.string().min(2),
  slug: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/)
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_user_id: payload.data.ownerUserId,
      name: payload.data.storeName,
      slug: payload.data.slug,
      status: "draft"
    })
    .select("id, slug")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ store: data }, { status: 201 });
}
