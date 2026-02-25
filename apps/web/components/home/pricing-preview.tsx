import { PLAN_CONFIGS } from "@/config/pricing";

export function PricingPreview() {
  return (
    <section className="rounded-lg border border-border bg-card/80 p-6 shadow-sm">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold">Pricing Built For Small Shops</h2>
        <p className="text-sm text-muted-foreground">Transparent tiers with configurable platform fee strategy.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-4">
        {Object.values(PLAN_CONFIGS).map((plan) => (
          <article key={plan.plan} className="rounded-md border border-border bg-muted/25 p-3">
            <h3 className="font-semibold">{plan.label}</h3>
            <p className="text-sm text-muted-foreground">${plan.monthlyPriceUsd}/mo</p>
            <p className="mt-1 text-xs">Platform fee: {(plan.platformFeeBps / 100).toFixed(2)}%</p>
          </article>
        ))}
      </div>
    </section>
  );
}
