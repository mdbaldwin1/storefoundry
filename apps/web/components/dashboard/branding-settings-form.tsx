"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/section-card";
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
  const [primaryColor, setPrimaryColor] = useState(initialBranding?.primary_color ?? "#0F7B84");
  const [accentColor, setAccentColor] = useState(initialBranding?.accent_color ?? "#1AA3A8");
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
    <SectionCard title="Branding" className="bg-muted/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Logo URL">
            <Input type="url" placeholder="https://..." value={logoPath} onChange={(event) => setLogoPath(event.target.value)} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Primary Color">
              <Input type="text" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
            </FormField>
            <FormField label="Accent Color">
              <Input type="text" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
            </FormField>
          </div>
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Preview values</p>
            <p className="mt-2 text-sm">Primary: {normalizeHex(primaryColor) ?? "invalid"}</p>
            <p className="text-sm">Accent: {normalizeHex(accentColor) ?? "invalid"}</p>
          </div>
          <FeedbackMessage type="error" message={error} />
          <FeedbackMessage type="success" message={message} />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save branding"}
          </Button>
        </form>
    </SectionCard>
  );
}
