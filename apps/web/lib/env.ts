import { z } from "zod";

export const coreEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const appUrlEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
  VERCEL_URL: z.string().min(1).optional()
});

export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_STARTER_PRICE_ID: z.string().min(1),
  STRIPE_GROWTH_PRICE_ID: z.string().min(1),
  STRIPE_SCALE_PRICE_ID: z.string().min(1)
});

export const envSchema = coreEnvSchema.merge(stripeEnvSchema).merge(appUrlEnvSchema);

let cachedCoreEnv: z.infer<typeof coreEnvSchema> | null = null;
let cachedStripeEnv: z.infer<typeof stripeEnvSchema> | null = null;
let cachedAppUrl: string | null = null;

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

function normalizeHostOrUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export function getAppUrl() {
  if (!cachedAppUrl) {
    const env = appUrlEnvSchema.parse(process.env);
    const candidate = env.NEXT_PUBLIC_APP_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;

    if (!candidate) {
      throw new Error("Missing app URL configuration (NEXT_PUBLIC_APP_URL or Vercel URL fallback).");
    }

    cachedAppUrl = z.string().url().parse(normalizeHostOrUrl(candidate));
  }

  return cachedAppUrl;
}

export function getEnv() {
  return { ...getCoreEnv(), ...getStripeEnv(), NEXT_PUBLIC_APP_URL: getAppUrl() };
}
