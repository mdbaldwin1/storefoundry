"use client";

import { useState } from "react";
import type { StoreSettingsRecord } from "@/types/database";

type StorePoliciesFormProps = {
  initialSettings: Pick<
    StoreSettingsRecord,
    "support_email" | "fulfillment_message" | "shipping_policy" | "return_policy" | "announcement"
  > | null;
};

type StoreSettingsResponse = {
  settings?: Pick<
    StoreSettingsRecord,
    "support_email" | "fulfillment_message" | "shipping_policy" | "return_policy" | "announcement"
  >;
  error?: string;
};

export function StorePoliciesForm({ initialSettings }: StorePoliciesFormProps) {
  const [supportEmail, setSupportEmail] = useState(initialSettings?.support_email ?? "");
  const [announcement, setAnnouncement] = useState(initialSettings?.announcement ?? "");
  const [fulfillmentMessage, setFulfillmentMessage] = useState(initialSettings?.fulfillment_message ?? "");
  const [shippingPolicy, setShippingPolicy] = useState(initialSettings?.shipping_policy ?? "");
  const [returnPolicy, setReturnPolicy] = useState(initialSettings?.return_policy ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/stores/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supportEmail: supportEmail.trim() || null,
        announcement: announcement.trim() || null,
        fulfillmentMessage: fulfillmentMessage.trim() || null,
        shippingPolicy: shippingPolicy.trim() || null,
        returnPolicy: returnPolicy.trim() || null
      })
    });

    const payload = (await response.json()) as StoreSettingsResponse;

    setSaving(false);

    if (!response.ok || !payload.settings) {
      setError(payload.error ?? "Unable to save policies.");
      return;
    }

    setMessage("Policies and contact settings saved.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <h2 className="text-lg font-semibold">Shop Policies and Contact</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Support Email</span>
          <input
            type="email"
            value={supportEmail}
            onChange={(event) => setSupportEmail(event.target.value)}
            placeholder="support@yourshop.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Announcement Bar Text</span>
          <input
            value={announcement}
            onChange={(event) => setAnnouncement(event.target.value)}
            maxLength={300}
            placeholder="Free local pickup every Friday"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Fulfillment Message</span>
          <textarea
            rows={2}
            value={fulfillmentMessage}
            onChange={(event) => setFulfillmentMessage(event.target.value)}
            placeholder="Small-batch orders ship in 2-4 business days"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Shipping Policy</span>
          <textarea
            rows={4}
            value={shippingPolicy}
            onChange={(event) => setShippingPolicy(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Return Policy</span>
          <textarea
            rows={4}
            value={returnPolicy}
            onChange={(event) => setReturnPolicy(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save policies"}
      </button>
    </form>
  );
}
