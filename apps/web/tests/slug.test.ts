import { describe, expect, test } from "vitest";
import { isValidStoreSlug, normalizeStoreSlug } from "@/lib/stores/slug";

describe("store slug utilities", () => {
  test("normalizes names into URL-safe slugs", () => {
    expect(normalizeStoreSlug("At Home Apothecary !!")).toBe("at-home-apothecary");
  });

  test("validates slug length and charset", () => {
    expect(isValidStoreSlug("tallow-shop")).toBe(true);
    expect(isValidStoreSlug("No")).toBe(false);
    expect(isValidStoreSlug("bad_slug")).toBe(false);
  });
});
