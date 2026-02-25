import { expect, test } from "@playwright/test";
import { activateStore, login, signupAndOnboard } from "./helpers";

test("storefront is hidden in draft and visible when store is active", async ({ page }) => {
  const identity = await signupAndOnboard(page);

  await page.goto("/dashboard");
  await page.getByLabel("Title").fill("Whipped Body Butter");
  await page.getByLabel("Description").fill("Tallow-based body butter.");
  await page.getByLabel("Price (USD)").fill("24.00");
  await page.getByLabel("Inventory qty").fill("8");
  await page.getByRole("button", { name: /add product/i }).click();

  const row = page.locator("tr", { hasText: "Whipped Body Butter" }).first();
  await row.getByRole("combobox").first().selectOption("active");

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /preview storefront/i })).toBeVisible();
  await page.goto(`/s/${identity.storeSlug}`);
  await expect(page.getByText(/whipped body butter/i)).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto(`/s/${identity.storeSlug}`);
  await expect(page.getByText(/this page could not be found/i)).toBeVisible();

  await login(page, identity.email, identity.password);
  await activateStore(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /view storefront/i })).toBeVisible();
  await page.goto(`/s/${identity.storeSlug}`);
  await expect(page.getByText(/whipped body butter/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /add to cart/i }).first()).toBeVisible();
});
