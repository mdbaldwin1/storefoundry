import { z } from "zod";

export const coreEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_STARTER_PRICE_ID: z.string().min(1),
  STRIPE_GROWTH_PRICE_ID: z.string().min(1),
  STRIPE_SCALE_PRICE_ID: z.string().min(1)
});

export const envSchema = coreEnvSchema.merge(stripeEnvSchema);

let cachedCoreEnv: z.infer<typeof coreEnvSchema> | null = null;
let cachedStripeEnv: z.infer<typeof stripeEnvSchema> | null = null;

export function getCoreEnv() {
  if (!cachedCoreEnv) {
    cachedCoreEnv = coreEnvSchema.parse(process.env);
  }

  return cachedCoreEnv;
}

export function getStripeEnv() {
  if (!cachedStripeEnv) {
    cachedStripeEnv = stripeEnvSchema.parse(process.env);
  }

  return cachedStripeEnv;
}

export function getEnv() {
  return { ...getCoreEnv(), ...getStripeEnv() };
}
