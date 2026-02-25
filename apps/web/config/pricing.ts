export type PlanKey = "free" | "starter" | "growth" | "scale";
export type StripePriceEnvKey = "STRIPE_STARTER_PRICE_ID" | "STRIPE_GROWTH_PRICE_ID" | "STRIPE_SCALE_PRICE_ID";
export type StripePriceIds = {
  STRIPE_STARTER_PRICE_ID: string;
  STRIPE_GROWTH_PRICE_ID: string;
  STRIPE_SCALE_PRICE_ID: string;
};

export type PlanConfig = {
  plan: PlanKey;
  label: string;
  monthlyPriceUsd: number;
  platformFeeBps: number;
  stripePriceEnvKey: StripePriceEnvKey | null;
};

export const PLAN_CONFIGS: Record<PlanKey, PlanConfig> = {
  free: {
    plan: "free",
    label: "Free",
    monthlyPriceUsd: 0,
    platformFeeBps: 200,
    stripePriceEnvKey: null
  },
  starter: {
    plan: "starter",
    label: "Starter",
    monthlyPriceUsd: 19,
    platformFeeBps: 100,
    stripePriceEnvKey: "STRIPE_STARTER_PRICE_ID"
  },
  growth: {
    plan: "growth",
    label: "Growth",
    monthlyPriceUsd: 49,
    platformFeeBps: 50,
    stripePriceEnvKey: "STRIPE_GROWTH_PRICE_ID"
  },
  scale: {
    plan: "scale",
    label: "Scale",
    monthlyPriceUsd: 99,
    platformFeeBps: 0,
    stripePriceEnvKey: "STRIPE_SCALE_PRICE_ID"
  }
};

export function getPlanConfig(plan: PlanKey): PlanConfig {
  return PLAN_CONFIGS[plan];
}

export function getPlanKeyByStripePriceId(priceId: string, stripePriceIds: StripePriceIds): PlanKey | null {
  if (priceId === stripePriceIds.STRIPE_STARTER_PRICE_ID) {
    return "starter";
  }

  if (priceId === stripePriceIds.STRIPE_GROWTH_PRICE_ID) {
    return "growth";
  }

  if (priceId === stripePriceIds.STRIPE_SCALE_PRICE_ID) {
    return "scale";
  }

  return null;
}
