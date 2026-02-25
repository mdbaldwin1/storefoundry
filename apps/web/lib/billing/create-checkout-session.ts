import { getAppUrl, getStripeEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/server";
import { getPlanConfig, type PlanKey } from "@/config/pricing";

type CreateCheckoutSessionInput = {
  storeId: string;
  userId: string;
  userEmail: string;
  plan: PlanKey;
  existingStripeCustomerId?: string | null;
};

export async function createSubscriptionCheckoutSession(input: CreateCheckoutSessionInput): Promise<string> {
  const planConfig = getPlanConfig(input.plan);

  if (!planConfig.stripePriceEnvKey) {
    throw new Error("Free plan does not require Stripe checkout.");
  }

  const stripeEnv = getStripeEnv();
  const stripe = getStripeClient();
  const appUrl = getAppUrl();
  const price = stripeEnv[planConfig.stripePriceEnvKey];

  const customerId =
    input.existingStripeCustomerId ||
    (
      await stripe.customers.create({
        email: input.userEmail,
        metadata: {
          owner_user_id: input.userId,
          store_id: input.storeId
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
      store_id: input.storeId,
      plan: input.plan,
      platform_fee_bps: String(planConfig.platformFeeBps)
    },
    subscription_data: {
      metadata: {
        store_id: input.storeId,
        plan: input.plan,
        platform_fee_bps: String(planConfig.platformFeeBps)
      }
    }
  });

  return session.url ?? `${appUrl}/dashboard?billing=cancelled`;
}
