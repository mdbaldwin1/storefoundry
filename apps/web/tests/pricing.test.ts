import { describe, expect, test } from "vitest";
import { getPlanConfig, getPlanKeyByStripePriceId } from "@/config/pricing";

describe("pricing config", () => {
  test("free plan has no stripe price id and includes platform fee", () => {
    const free = getPlanConfig("free");

    expect(free.stripePriceEnvKey).toBeNull();
    expect(free.platformFeeBps).toBeGreaterThan(0);
  });

  test("scale plan has no platform fee", () => {
    const scale = getPlanConfig("scale");

    expect(scale.platformFeeBps).toBe(0);
  });

  test("maps stripe price IDs back to plan keys", () => {
    const plan = getPlanKeyByStripePriceId("price_growth", {
      STRIPE_STARTER_PRICE_ID: "price_starter",
      STRIPE_GROWTH_PRICE_ID: "price_growth",
      STRIPE_SCALE_PRICE_ID: "price_scale"
    });

    expect(plan).toBe("growth");
    expect(
      getPlanKeyByStripePriceId("price_unknown", {
        STRIPE_STARTER_PRICE_ID: "price_starter",
        STRIPE_GROWTH_PRICE_ID: "price_growth",
        STRIPE_SCALE_PRICE_ID: "price_scale"
      })
    ).toBeNull();
  });
});
