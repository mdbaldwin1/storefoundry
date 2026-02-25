"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLAN_CONFIGS, type PlanKey } from "@/config/pricing";

type SubscriptionPlanSelectorProps = {
  currentPlan: PlanKey;
  currentStatus: string;
};

type SelectPlanResponse = {
  mode?: "direct" | "checkout";
  redirectUrl?: string;
  checkoutUrl?: string;
  error?: string;
};

export function SubscriptionPlanSelector({ currentPlan, currentStatus }: SubscriptionPlanSelectorProps) {
  const [pendingPlan, setPendingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectPlan(plan: PlanKey) {
    setPendingPlan(plan);
    setError(null);

    const response = await fetch("/api/subscriptions/select-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });

    const payload = (await response.json()) as SelectPlanResponse;

    if (!response.ok) {
      setError(payload.error ?? "Unable to update subscription plan.");
      setPendingPlan(null);
      return;
    }

    if (payload.mode === "checkout" && payload.checkoutUrl) {
      window.location.assign(payload.checkoutUrl);
      return;
    }

    if (payload.redirectUrl) {
      window.location.assign(payload.redirectUrl);
      return;
    }

    window.location.reload();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subscription</h3>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Current: {currentPlan} ({currentStatus})
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.values(PLAN_CONFIGS).map((plan) => {
          const active = currentPlan === plan.plan;
          const loading = pendingPlan === plan.plan;

          return (
            <Card key={plan.plan} className="bg-muted/40">
              <CardContent className="space-y-3 p-3">
                <header>
                  <h4 className="font-medium">{plan.label}</h4>
                  <p className="text-sm text-muted-foreground">
                    ${plan.monthlyPriceUsd}/mo • Platform fee {(plan.platformFeeBps / 100).toFixed(2)}%
                  </p>
                </header>
                <Button
                  type="button"
                  onClick={() => void selectPlan(plan.plan)}
                  disabled={active || loading}
                  className="w-full"
                >
                  {active ? "Current plan" : loading ? "Updating..." : `Choose ${plan.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
