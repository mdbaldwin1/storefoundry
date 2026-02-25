"use client";

import { useState } from "react";
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <h2 className="text-lg font-semibold">Store Profile</h2>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Store Name</span>
        <input
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Store Status</span>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StoreRecord["status"])}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      <p className="text-xs text-muted-foreground">Public storefront is visible only when status is set to Active.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
