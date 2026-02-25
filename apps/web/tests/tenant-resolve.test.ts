import { describe, expect, test } from "vitest";
import { resolveTenantLookup } from "@/lib/tenant/resolve";

describe("resolveTenantLookup", () => {
  test("returns platform for root host", () => {
    expect(resolveTenantLookup("myrivo.app")).toEqual({ type: "platform", key: null });
  });

  test("returns slug for subdomain host", () => {
    expect(resolveTenantLookup("olive.myrivo.app")).toEqual({ type: "slug", key: "olive" });
  });

  test("returns domain for custom host", () => {
    expect(resolveTenantLookup("athomeapothacary.com")).toEqual({ type: "domain", key: "athomeapothacary.com" });
  });

  test("returns missing for empty host", () => {
    expect(resolveTenantLookup(null)).toEqual({ type: "missing", key: null });
  });
});
