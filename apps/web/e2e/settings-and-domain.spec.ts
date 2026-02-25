import { expect, test } from "@playwright/test";
import { signupAndOnboard } from "./helpers";

test("merchant can update profile, branding, policies, and domains", async ({ page }) => {
  await signupAndOnboard(page);

  await page.goto("/dashboard/settings");

  await page.getByLabel("Store Name").fill("At Home Apothecary");
  await page.getByRole("button", { name: /save profile/i }).click();
  await expect(page.getByText(/store settings saved/i)).toBeVisible();

  await page.getByLabel("Logo URL").fill("https://images.unsplash.com/photo-1514996937319-344454492b37");
  await page.getByLabel("Primary Color").fill("#7A3A1A");
  await page.getByLabel("Accent Color").fill("#C7662E");
  await page.getByRole("button", { name: /save branding/i }).click();
  await expect(page.getByText(/branding settings saved/i)).toBeVisible();

  await page.getByLabel("Support Email").fill("support@athomeapothacary.com");
  await page.getByLabel("Shipping Policy").fill("Ships within 2 business days.");
  await page.getByRole("button", { name: /save policies/i }).click();
  await expect(page.getByText(/policies and contact settings saved/i)).toBeVisible();

  await page.getByPlaceholder("athomeapothacary.com").fill("athomeapothacary.com");
  await page.getByRole("button", { name: /^add domain$/i }).click();
  await expect(page.getByText("athomeapothacary.com")).toBeVisible();

  await page.getByPlaceholder("athomeapothacary.com").fill("shop.athomeapothacary.com");
  await page.getByRole("button", { name: /^add domain$/i }).click();
  await expect(page.getByText("shop.athomeapothacary.com")).toBeVisible();

  const secondDomainRow = page.locator("li", { hasText: "shop.athomeapothacary.com" }).first();
  await secondDomainRow.getByRole("button", { name: /set primary/i }).click();
  await expect(secondDomainRow.getByText(/primary/i)).toBeVisible();
});
