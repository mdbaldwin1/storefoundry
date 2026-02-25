import { describe, expect, test } from "vitest";
import { envSchema, publicEnvSchema, serverEnvSchema, stripeEnvSchema, stripeModeEnvSchema } from "@/lib/env";

describe("env schema", () => {
  test("public env validates browser-safe keys", () => {
    const parsed = publicEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY: "true"
    });

    expect(parsed.success).toBe(true);
  });

  test("server env validates service role key", () => {
    const parsed = serverEnvSchema.safeParse({
      SUPABASE_SERVICE_ROLE_KEY: "service-role"
    });

    expect(parsed.success).toBe(true);
  });

  test("stripe env validates billing keys", () => {
    const parsed = stripeEnvSchema.safeParse({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_STARTER_PRICE_ID: "price_1",
      STRIPE_GROWTH_PRICE_ID: "price_2",
      STRIPE_SCALE_PRICE_ID: "price_3"
    });

    expect(parsed.success).toBe(true);
  });

  test("stripe mode env allows stub toggle", () => {
    const parsed = stripeModeEnvSchema.safeParse({
      STRIPE_STUB_MODE: "true"
    });

    expect(parsed.success).toBe(true);
  });

  test("accepts full config", () => {
    const parsed = envSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY: "false",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      STRIPE_STUB_MODE: "false",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_STARTER_PRICE_ID: "price_1",
      STRIPE_GROWTH_PRICE_ID: "price_2",
      STRIPE_SCALE_PRICE_ID: "price_3",
      VERCEL_PROJECT_PRODUCTION_URL: "storefoundry.vercel.app"
    });

    expect(parsed.success).toBe(true);
  });

  test("accepts stub config without live stripe keys", () => {
    const parsed = envSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY: "true",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      STRIPE_STUB_MODE: "true",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000"
    });

    expect(parsed.success).toBe(true);
  });
});
