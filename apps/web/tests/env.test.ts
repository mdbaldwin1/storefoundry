import { describe, expect, test } from "vitest";
import { envSchema } from "@/lib/env";

describe("env schema", () => {
  test("accepts full config", () => {
    const parsed = envSchema.safeParse({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
      STRIPE_STARTER_PRICE_ID: "price_1",
      STRIPE_GROWTH_PRICE_ID: "price_2",
      STRIPE_SCALE_PRICE_ID: "price_3"
    });

    expect(parsed.success).toBe(true);
  });
});
