"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { Textarea } from "@/components/ui/textarea";
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
    <SectionCard title="Shop Policies and Contact" className="bg-muted/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Support Email" className="sm:col-span-2">
              <Input
                type="email"
                value={supportEmail}
                onChange={(event) => setSupportEmail(event.target.value)}
                placeholder="support@yourshop.com"
              />
            </FormField>
            <FormField label="Announcement Bar Text" className="sm:col-span-2">
              <Input
                value={announcement}
                onChange={(event) => setAnnouncement(event.target.value)}
                maxLength={300}
                placeholder="Free local pickup every Friday"
              />
            </FormField>
            <FormField label="Fulfillment Message" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={fulfillmentMessage}
                onChange={(event) => setFulfillmentMessage(event.target.value)}
                placeholder="Small-batch orders ship in 2-4 business days"
              />
            </FormField>
            <FormField label="Shipping Policy">
              <Textarea rows={4} value={shippingPolicy} onChange={(event) => setShippingPolicy(event.target.value)} />
            </FormField>
            <FormField label="Return Policy">
              <Textarea rows={4} value={returnPolicy} onChange={(event) => setReturnPolicy(event.target.value)} />
            </FormField>
          </div>
          <FeedbackMessage type="error" message={error} />
          <FeedbackMessage type="success" message={message} />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save policies"}
          </Button>
        </form>
    </SectionCard>
  );
}
