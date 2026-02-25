import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppUrl, getStripeEnv } from "@/lib/env";
import { getPlanConfig, type PlanKey } from "@/config/pricing";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  plan: z.enum(["free", "starter", "growth", "scale"]),
  storeId: z.string().uuid().optional()
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

  const stripe = getStripeClient();
  const stripeEnv = getStripeEnv();
  const appUrl = getAppUrl();
  const planConfig = getPlanConfig(payload.data.plan as PlanKey);

  if (!planConfig.stripePriceEnvKey) {
    return NextResponse.json(
      { error: "Free plan does not require a Stripe checkout session." },
      { status: 400 }
    );
  }

  const price = stripeEnv[planConfig.stripePriceEnvKey];
  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("store_id", ownedStore.id)
    .maybeSingle();

  if (existingSubscriptionError) {
    return NextResponse.json({ error: existingSubscriptionError.message }, { status: 500 });
  }

  const customerId =
    existingSubscription?.stripe_customer_id ||
    (
      await stripe.customers.create({
        email: user.email,
        metadata: {
          owner_user_id: user.id,
          store_id: ownedStore.id
        }
      })
    ).id;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer: customerId,
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url: `${appUrl}/dashboard?billing=cancelled`,
    metadata: {
      store_id: ownedStore.id,
      plan: payload.data.plan,
      platform_fee_bps: String(planConfig.platformFeeBps)
    },
    subscription_data: {
      metadata: {
        store_id: ownedStore.id,
        plan: payload.data.plan,
        platform_fee_bps: String(planConfig.platformFeeBps)
      }
    }
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
