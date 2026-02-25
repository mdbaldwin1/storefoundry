"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
import { Select } from "@/components/ui/select";
import type { StoreRecord } from "@/types/database";

type StoreSettingsFormProps = {
  initialStore: Pick<StoreRecord, "id" | "name" | "slug" | "status">;
};

type StoreResponse = {
  store?: Pick<StoreRecord, "id" | "name" | "slug" | "status">;
  error?: string;
};

export function StoreSettingsForm({ initialStore }: StoreSettingsFormProps) {
  const [name, setName] = useState(initialStore.name);
  const [status, setStatus] = useState<StoreRecord["status"]>(initialStore.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/stores/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, status })
    });

    const payload = (await response.json()) as StoreResponse;

    setSaving(false);

    if (!response.ok || !payload.store) {
      setError(payload.error ?? "Unable to update store settings.");
      return;
    }

    setMessage("Store settings saved.");
  }

  return (
    <SectionCard title="Store Profile" className="bg-muted/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Store Name">
            <Input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField label="Store Status">
            <Select value={status} onChange={(event) => setStatus(event.target.value as StoreRecord["status"])}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </FormField>
          <p className="text-xs text-muted-foreground">Public storefront is visible only when status is set to Active.</p>
          <FeedbackMessage type="error" message={error} />
          <FeedbackMessage type="success" message={message} />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </form>
    </SectionCard>
  );
}
