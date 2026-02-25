import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl, isStripeStubMode } from "@/lib/env";
import { getPlanConfig, type PlanKey } from "@/config/pricing";
import { createSubscriptionCheckoutSession } from "@/lib/billing/create-checkout-session";
import { enforceTrustedOrigin } from "@/lib/security/request-origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  plan: z.enum(["free", "starter", "growth", "scale"]),
  storeId: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  const trustedOriginResponse = enforceTrustedOrigin(request);

  if (trustedOriginResponse) {
    return trustedOriginResponse;
  }

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

  if (!user.email) {
    return NextResponse.json({ error: "Missing user email" }, { status: 400 });
  }

  const storeQuery = supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  const { data: ownedStore, error: ownedStoreError } = payload.data.storeId
    ? await storeQuery.eq("id", payload.data.storeId).maybeSingle()
    : await storeQuery.maybeSingle();

  if (ownedStoreError) {
    return NextResponse.json({ error: ownedStoreError.message }, { status: 500 });
  }

  if (!ownedStore) {
    return NextResponse.json({ error: "No store found for account" }, { status: 404 });
  }

  const planConfig = getPlanConfig(payload.data.plan as PlanKey);

  if (!planConfig.stripePriceEnvKey) {
    return NextResponse.json(
      { error: "Free plan does not require a Stripe checkout session." },
      { status: 400 }
    );
  }

  const appUrl = getAppUrl();
  if (isStripeStubMode()) {
    const stubCustomerId = `stub_cus_${user.id.replaceAll("-", "")}`;
    const stubSubscriptionId = `stub_sub_${ownedStore.id.replaceAll("-", "")}_${payload.data.plan}`;
    const { error: stubUpsertError } = await supabase.from("subscriptions").upsert(
      {
        store_id: ownedStore.id,
        stripe_customer_id: stubCustomerId,
        stripe_subscription_id: stubSubscriptionId,
        plan_key: payload.data.plan,
        status: "active",
        platform_fee_bps: planConfig.platformFeeBps
      },
      { onConflict: "store_id" }
    );

    if (stubUpsertError) {
      return NextResponse.json({ error: stubUpsertError.message }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: `${appUrl}/dashboard?billing=stubbed&plan=${payload.data.plan}` });
  }

  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("store_id", ownedStore.id)
    .maybeSingle();

  if (existingSubscriptionError) {
    return NextResponse.json({ error: existingSubscriptionError.message }, { status: 500 });
  }

  const checkoutUrl = await createSubscriptionCheckoutSession({
    storeId: ownedStore.id,
    userId: user.id,
    userEmail: user.email,
    plan: payload.data.plan as PlanKey,
    existingStripeCustomerId: existingSubscription?.stripe_customer_id
  });

  return NextResponse.json({ checkoutUrl });
}
