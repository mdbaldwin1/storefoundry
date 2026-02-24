import Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (!stripe) {
    stripe = new Stripe(getStripeEnv().STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover"
    });
  }

  return stripe;
}
