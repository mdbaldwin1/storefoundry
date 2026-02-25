import type { CSSProperties } from "react";

const DEFAULT_PRIMARY = "#0F7B84";
const DEFAULT_ACCENT = "#1AA3A8";

export type StorefrontThemeInput = {
  primaryColor?: string | null;
  accentColor?: string | null;
};

function normalizeHex(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const value = input.trim();
  return /^#([0-9a-fA-F]{6})$/.test(value) ? value.toUpperCase() : null;
}

export function buildStorefrontThemeStyle(input: StorefrontThemeInput): CSSProperties {
  const primary = normalizeHex(input.primaryColor) ?? DEFAULT_PRIMARY;
  const accent = normalizeHex(input.accentColor) ?? DEFAULT_ACCENT;

  return {
    ["--storefront-primary" as string]: primary,
    ["--storefront-accent" as string]: accent
  };
}
