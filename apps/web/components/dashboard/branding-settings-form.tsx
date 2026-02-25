"use client";

import { useState } from "react";
import type { StoreBrandingRecord } from "@/types/database";

type BrandingSettingsFormProps = {
  initialBranding: Pick<StoreBrandingRecord, "logo_path" | "primary_color" | "accent_color"> | null;
};

type BrandingResponse = {
  branding?: Pick<StoreBrandingRecord, "logo_path" | "primary_color" | "accent_color">;
  error?: string;
};

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? hex.toUpperCase() : null;
}

export function BrandingSettingsForm({ initialBranding }: BrandingSettingsFormProps) {
  const [logoPath, setLogoPath] = useState(initialBranding?.logo_path ?? "");
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.primary_color ?? "#8C4218");
  const [accentColor, setAccentColor] = useState(initialBranding?.accent_color ?? "#CC5A2A");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const parsedPrimary = normalizeHex(primaryColor);
    const parsedAccent = normalizeHex(accentColor);

    if (!parsedPrimary || !parsedAccent) {
      setError("Primary and accent colors must be valid 6-digit hex values.");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/stores/branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logoPath: logoPath.trim() || null,
        primaryColor: parsedPrimary,
        accentColor: parsedAccent
      })
    });

    const payload = (await response.json()) as BrandingResponse;

    setSaving(false);

    if (!response.ok || !payload.branding) {
      setError(payload.error ?? "Unable to save branding settings.");
      return;
    }

    setMessage("Branding settings saved.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <h2 className="text-lg font-semibold">Branding</h2>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Logo URL</span>
        <input
          type="url"
          placeholder="https://..."
          value={logoPath}
          onChange={(event) => setLogoPath(event.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Primary Color</span>
          <input
            type="text"
            value={primaryColor}
            onChange={(event) => setPrimaryColor(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Accent Color</span>
          <input
            type="text"
            value={accentColor}
            onChange={(event) => setAccentColor(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>
      <div className="rounded-md border border-border bg-background p-3">
        <p className="text-xs text-muted-foreground">Preview values</p>
        <p className="mt-2 text-sm">Primary: {normalizeHex(primaryColor) ?? "invalid"}</p>
        <p className="text-sm">Accent: {normalizeHex(accentColor) ?? "invalid"}</p>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save branding"}
      </button>
    </form>
  );
}
