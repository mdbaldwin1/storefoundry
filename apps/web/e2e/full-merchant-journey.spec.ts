import { expect, test } from "@playwright/test";
import { activateStore, signupAndOnboard } from "./helpers";

test("full merchant journey from onboarding to fulfillment and reporting", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  const identity = await signupAndOnboard(page);

  await page.goto("/dashboard");
  await page.getByLabel("Title").fill("Whipped Tallow Balm");
  await page.getByLabel("Description").fill("Nourishing balm for daily skin support.");
  await page.getByLabel("SKU").fill("BALM-001");
  await page.getByLabel("Image URL").fill("https://images.unsplash.com/photo-1556228720-195a672e8a03");
  await page.getByLabel("Price (USD)").fill("18.00");
  await page.getByLabel("Inventory qty").fill("25");
  await page.getByRole("checkbox", { name: /featured product/i }).check();
  await page.getByRole("button", { name: /add product/i }).click();
  await expect(page.getByText("Whipped Tallow Balm")).toBeVisible();

  const row = page.locator("tr", { hasText: "Whipped Tallow Balm" }).first();
  await row.getByRole("combobox").first().selectOption("active");

  await activateStore(page);

  await page.getByLabel("Announcement Bar Text").fill("Free local pickup every Friday");
  await page.getByRole("button", { name: /save policies/i }).click();
  await expect(page.getByText(/policies and contact settings saved/i)).toBeVisible();

  await page.getByPlaceholder("WELCOME10").fill("WELCOME10");
  await page.getByRole("combobox").filter({ hasText: /percent|fixed/i }).first().selectOption("percent");
  await page.locator('input[ inputmode="numeric" ]').first().fill("10");
  await page.getByPlaceholder("Min subtotal USD").fill("10.00");
  await page.getByRole("button", { name: /create promotion/i }).click();
  await expect(page.getByText("WELCOME10")).toBeVisible();

  await page.goto(`/s/${identity.storeSlug}`);
  await page.getByRole("button", { name: /add to cart/i }).first().click();
  await page.getByPlaceholder(/promo code/i).fill("WELCOME10");
  await page.getByRole("button", { name: /apply promo/i }).click();
  await expect(page.getByText(/discount applied/i)).toBeVisible();

  await page.getByPlaceholder("you@example.com").fill(`shopper+${identity.suffix}@example.com`);
  await page.getByRole("button", { name: /^checkout$/i }).click();
  await expect(page.getByText(/order .* placed/i)).toBeVisible();

  await page.goto("/dashboard/orders");
  await expect(page.getByText(`shopper+${identity.suffix}@example.com`)).toBeVisible();

  const orderRow = page.locator("tr", { hasText: `shopper+${identity.suffix}@example.com` }).first();
  const selects = orderRow.getByRole("combobox");
  await selects.nth(1).selectOption("processing");
  await expect(orderRow.getByRole("combobox").nth(1)).toHaveValue("processing");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /export csv/i }).click()
  ]);
  expect(download.suggestedFilename()).toContain("orders");

  await page.goto("/dashboard/insights");
  await expect(page.getByText(/paid revenue/i)).toBeVisible();
  await expect(page.getByText(/daily revenue/i)).toBeVisible();
});
