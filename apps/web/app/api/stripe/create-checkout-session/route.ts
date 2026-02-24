import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getPlanConfig, type PlanKey } from "@/config/pricing";
import { getStripeClient } from "@/lib/stripe/server";

const payloadSchema = z.object({
  plan: z.enum(["free", "starter", "growth", "scale"]),
  customerEmail: z.string().email(),
  storeId: z.string().uuid()
});

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const stripe = getStripeClient();
  const env = getEnv();
  const planConfig = getPlanConfig(payload.data.plan as PlanKey);

  if (!planConfig.stripePriceEnvKey) {
    return NextResponse.json(
      { error: "Free plan does not require Stripe checkout session. Use direct plan assignment flow." },
      { status: 400 }
    );
  }

  const price = env[planConfig.stripePriceEnvKey];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: payload.data.customerEmail,
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?billing=cancelled`,
    metadata: {
      store_id: payload.data.storeId,
      plan: payload.data.plan,
      platform_fee_bps: String(planConfig.platformFeeBps)
    }
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
