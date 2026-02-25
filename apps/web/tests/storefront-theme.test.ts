import { describe, expect, test } from "vitest";
import { buildStorefrontThemeStyle } from "@/lib/theme/storefront-theme";

describe("storefront theme style", () => {
  test("uses provided valid hex colors", () => {
    const style = buildStorefrontThemeStyle({ primaryColor: "#112233", accentColor: "#AABBCC" }) as Record<string, string>;
    expect(style["--storefront-primary"]).toBe("#112233");
    expect(style["--storefront-accent"]).toBe("#AABBCC");
  });

  test("falls back to defaults for invalid colors", () => {
    const style = buildStorefrontThemeStyle({ primaryColor: "blue", accentColor: "#123" }) as Record<string, string>;
    expect(style["--storefront-primary"]).toBe("#0F7B84");
    expect(style["--storefront-accent"]).toBe("#1AA3A8");
  });
});
