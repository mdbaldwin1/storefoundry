import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/server";

const payloadSchema = z.object({
  plan: z.enum(["starter", "growth", "scale"]),
  customerEmail: z.string().email(),
  storeId: z.string().uuid()
});

const planPriceMap = {
  starter: () => getEnv().STRIPE_STARTER_PRICE_ID,
  growth: () => getEnv().STRIPE_GROWTH_PRICE_ID,
  scale: () => getEnv().STRIPE_SCALE_PRICE_ID
};

export async function POST(request: NextRequest) {
  const payload = payloadSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", details: payload.error.flatten() }, { status: 400 });
  }

  const stripe = getStripeClient();
  const env = getEnv();
  const price = planPriceMap[payload.data.plan]();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: payload.data.customerEmail,
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?billing=cancelled`,
    metadata: {
      store_id: payload.data.storeId,
      plan: payload.data.plan
    }
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
