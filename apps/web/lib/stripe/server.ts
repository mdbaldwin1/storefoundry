import Stripe from "stripe";
import { getEnv } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (!stripe) {
    stripe = new Stripe(getEnv().STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover"
    });
  }

  return stripe;
}
