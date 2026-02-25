import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPlanConfig, type PlanKey } from "@/config/pricing";
import { createSubscriptionCheckoutSession } from "@/lib/billing/create-checkout-session";
import { isStripeStubMode } from "@/lib/env";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  plan: z.enum(["free", "starter", "growth", "scale"])
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

  if (!user.email) {
    return NextResponse.json({ error: "Missing user email" }, { status: 400 });
  }

  const bundle = await getOwnedStoreBundle(user.id);

  if (!bundle) {
    return NextResponse.json({ error: "No store found for account" }, { status: 404 });
  }

  const plan = payload.data.plan as PlanKey;
  const planConfig = getPlanConfig(plan);

  if (plan === "free" || isStripeStubMode()) {
    const stripePrefix = isStripeStubMode() ? "stub" : "free";

    const { error } = await supabase.from("subscriptions").upsert(
      {
        store_id: bundle.store.id,
        stripe_customer_id: `${stripePrefix}_cus_${user.id.replaceAll("-", "")}`,
        stripe_subscription_id: `${stripePrefix}_sub_${bundle.store.id.replaceAll("-", "")}_${plan}`,
        plan_key: plan,
        status: "active",
        platform_fee_bps: planConfig.platformFeeBps
      },
      { onConflict: "store_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mode: "direct", redirectUrl: `/dashboard?plan=${plan}` });
  }

  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("store_id", bundle.store.id)
    .maybeSingle();

  if (existingSubscriptionError) {
    return NextResponse.json({ error: existingSubscriptionError.message }, { status: 500 });
  }

  const checkoutUrl = await createSubscriptionCheckoutSession({
    storeId: bundle.store.id,
    userId: user.id,
    userEmail: user.email,
    plan,
    existingStripeCustomerId: existingSubscription?.stripe_customer_id
  });

  return NextResponse.json({ mode: "checkout", checkoutUrl });
}
