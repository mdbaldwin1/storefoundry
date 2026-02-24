import { describe, expect, test } from "vitest";
import { getPlanConfig } from "@/config/pricing";

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
});
