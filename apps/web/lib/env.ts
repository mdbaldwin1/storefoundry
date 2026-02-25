import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY: z.string().optional()
});

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const appUrlEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
  VERCEL_URL: z.string().min(1).optional()
});

export const stripeModeEnvSchema = z.object({
  STRIPE_STUB_MODE: z.string().optional()
});

export const stripeEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_STARTER_PRICE_ID: z.string().min(1),
  STRIPE_GROWTH_PRICE_ID: z.string().min(1),
  STRIPE_SCALE_PRICE_ID: z.string().min(1)
});

export const envSchema = publicEnvSchema
  .merge(serverEnvSchema)
  .merge(stripeModeEnvSchema)
  .merge(stripeEnvSchema.partial())
  .merge(appUrlEnvSchema);

let cachedPublicEnv: z.infer<typeof publicEnvSchema> | null = null;
let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;
let cachedStripeEnv: z.infer<typeof stripeEnvSchema> | null = null;
let cachedStripeStubMode: boolean | null = null;
let cachedAppUrl: string | null = null;

export function getPublicEnv() {
  if (!cachedPublicEnv) {
    cachedPublicEnv = publicEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY: process.env.NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY
    });
  }

  return cachedPublicEnv;
}

export function getServerEnv() {
  if (!cachedServerEnv) {
    cachedServerEnv = serverEnvSchema.parse({
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  }

  return cachedServerEnv;
}

export function getStripeEnv() {
  if (!cachedStripeEnv) {
    cachedStripeEnv = stripeEnvSchema.parse({
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      STRIPE_STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID,
      STRIPE_GROWTH_PRICE_ID: process.env.STRIPE_GROWTH_PRICE_ID,
      STRIPE_SCALE_PRICE_ID: process.env.STRIPE_SCALE_PRICE_ID
    });
  }

  return cachedStripeEnv;
}

export function isStripeStubMode() {
  if (cachedStripeStubMode === null) {
    const parsed = stripeModeEnvSchema.parse({ STRIPE_STUB_MODE: process.env.STRIPE_STUB_MODE });
    const normalized = parsed.STRIPE_STUB_MODE?.trim().toLowerCase();
    cachedStripeStubMode = normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return cachedStripeStubMode;
}

function normalizeHostOrUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export function getAppUrl() {
  if (!cachedAppUrl) {
    const env = appUrlEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      VERCEL_URL: process.env.VERCEL_URL
    });
    const candidate = env.NEXT_PUBLIC_APP_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL;

    if (!candidate) {
      throw new Error("Missing app URL configuration (NEXT_PUBLIC_APP_URL or Vercel URL fallback).");
    }

    cachedAppUrl = z.string().url().parse(normalizeHostOrUrl(candidate));
  }

  return cachedAppUrl;
}

export function getEnv() {
  return { ...getPublicEnv(), ...getServerEnv(), ...getStripeEnv(), NEXT_PUBLIC_APP_URL: getAppUrl() };
}
