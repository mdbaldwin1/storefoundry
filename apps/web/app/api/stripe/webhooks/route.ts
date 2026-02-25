import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getPlanConfig, getPlanKeyByStripePriceId, type PlanKey } from "@/config/pricing";
import { getStripeEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ManagedStripeStatus = "active" | "past_due" | "cancelled" | "incomplete" | "trialing";

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): ManagedStripeStatus {
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "trialing") return "trialing";
  if (status === "incomplete" || status === "incomplete_expired") return "incomplete";
  return "cancelled";
}

async function upsertSubscriptionFromStripe(
  subscription: Stripe.Subscription,
  fallbackStoreId?: string,
  fallbackPlan?: PlanKey
) {
  const stripeEnv = getStripeEnv();
  const supabase = createSupabaseAdminClient();
  const priceId = subscription.items.data[0]?.price.id;
  const metadataPlan = subscription.metadata.plan as PlanKey | undefined;
  const resolvedPlan = metadataPlan ?? fallbackPlan ?? (priceId ? getPlanKeyByStripePriceId(priceId, stripeEnv) : null);
  const storeId = subscription.metadata.store_id || fallbackStoreId;

  if (!storeId || !resolvedPlan) {
    return;
  }

  const status = normalizeSubscriptionStatus(subscription.status);
  const planConfig = getPlanConfig(resolvedPlan);

  await supabase.from("subscriptions").upsert({
    store_id: storeId,
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    plan_key: resolvedPlan,
    status,
    platform_fee_bps: planConfig.platformFeeBps
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, getStripeEnv().STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: `Invalid signature: ${(error as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const storeId = session.metadata?.store_id;
    const plan = session.metadata?.plan as PlanKey | undefined;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (subscriptionId) {
      const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
      await upsertSubscriptionFromStripe(subscription, storeId, plan);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    await upsertSubscriptionFromStripe(subscription);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const supabase = createSupabaseAdminClient();

    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("stripe_subscription_id", subscription.id);
  }

  return NextResponse.json({ received: true });
}
