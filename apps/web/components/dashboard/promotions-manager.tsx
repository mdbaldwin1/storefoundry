"use client";

import { useState } from "react";
import type { PromotionRecord } from "@/types/database";

type PromotionsManagerProps = {
  initialPromotions: Array<
    Pick<
      PromotionRecord,
      | "id"
      | "code"
      | "discount_type"
      | "discount_value"
      | "min_subtotal_cents"
      | "max_redemptions"
      | "times_redeemed"
      | "starts_at"
      | "ends_at"
      | "is_active"
      | "created_at"
    >
  >;
};

type PromotionResponse = {
  promotion?: Pick<
    PromotionRecord,
    | "id"
    | "code"
    | "discount_type"
    | "discount_value"
    | "min_subtotal_cents"
    | "max_redemptions"
    | "times_redeemed"
    | "starts_at"
    | "ends_at"
    | "is_active"
    | "created_at"
  >;
  deleted?: boolean;
  error?: string;
};

export function PromotionsManager({ initialPromotions }: PromotionsManagerProps) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<PromotionRecord["discount_type"]>("percent");
  const [discountValue, setDiscountValue] = useState("10");
  const [minSubtotalDollars, setMinSubtotalDollars] = useState("0.00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createPromotion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const minSubtotalCents = Math.round(Number(minSubtotalDollars) * 100);
    const response = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        discountType,
        discountValue: Number(discountValue),
        minSubtotalCents,
        isActive: true
      })
    });

    const payload = (await response.json()) as PromotionResponse;
    setSaving(false);

    if (!response.ok || !payload.promotion) {
      setError(payload.error ?? "Unable to create promotion.");
      return;
    }

    setPromotions((current) => [payload.promotion!, ...current]);
    setCode("");
    setDiscountValue("10");
    setMinSubtotalDollars("0.00");
  }

  async function toggleActive(promotionId: string, isActive: boolean) {
    setError(null);

    const response = await fetch("/api/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promotionId, isActive: !isActive })
    });

    const payload = (await response.json()) as PromotionResponse;

    if (!response.ok || !payload.promotion) {
      setError(payload.error ?? "Unable to update promotion.");
      return;
    }

    setPromotions((current) => current.map((item) => (item.id === promotionId ? payload.promotion! : item)));
  }

  async function removePromotion(promotionId: string) {
    setError(null);

    const response = await fetch("/api/promotions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ promotionId })
    });

    const payload = (await response.json()) as PromotionResponse;

    if (!response.ok || !payload.deleted) {
      setError(payload.error ?? "Unable to remove promotion.");
      return;
    }

    setPromotions((current) => current.filter((item) => item.id !== promotionId));
  }

  return (
    <section className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <h2 className="text-lg font-semibold">Promotions</h2>
      <form onSubmit={createPromotion} className="grid gap-2 md:grid-cols-4">
        <input
          required
          placeholder="WELCOME10"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={discountType}
          onChange={(event) => setDiscountType(event.target.value as PromotionRecord["discount_type"])}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="percent">Percent</option>
          <option value="fixed">Fixed ($ cents)</option>
        </select>
        <input
          required
          inputMode="numeric"
          value={discountValue}
          onChange={(event) => setDiscountValue(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          required
          inputMode="decimal"
          placeholder="Min subtotal USD"
          value={minSubtotalDollars}
          onChange={(event) => setMinSubtotalDollars(event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 md:col-span-4"
        >
          {saving ? "Creating..." : "Create promotion"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-2">
        {promotions.length === 0 ? (
          <li className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">No promotions yet.</li>
        ) : (
          promotions.map((promo) => (
            <li key={promo.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="font-semibold">{promo.code}</span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                {promo.discount_type === "percent" ? `${promo.discount_value}%` : `$${(promo.discount_value / 100).toFixed(2)}`}
              </span>
              <span className="text-xs text-muted-foreground">Min ${(promo.min_subtotal_cents / 100).toFixed(2)}</span>
              <span className="text-xs text-muted-foreground">Used {promo.times_redeemed}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${promo.is_active ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                {promo.is_active ? "active" : "inactive"}
              </span>
              <button type="button" onClick={() => void toggleActive(promo.id, promo.is_active)} className="ml-auto rounded-md border border-border px-2 py-1 text-xs">
                {promo.is_active ? "Deactivate" : "Activate"}
              </button>
              <button type="button" onClick={() => void removePromotion(promo.id)} className="rounded-md border border-border px-2 py-1 text-xs">
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
