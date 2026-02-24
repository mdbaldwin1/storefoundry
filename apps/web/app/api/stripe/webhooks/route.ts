import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeClient().webhooks.constructEvent(payload, signature, getEnv().STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: `Invalid signature: ${(error as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const storeId = session.metadata?.store_id;

    if (storeId && session.customer && session.subscription) {
      const supabase = createSupabaseAdminClient();
      await supabase.from("subscriptions").upsert({
        store_id: storeId,
        stripe_customer_id: String(session.customer),
        stripe_subscription_id: String(session.subscription),
        plan_key: session.metadata?.plan ?? "starter",
        status: "active"
      });
    }
  }

  return NextResponse.json({ received: true });
}
