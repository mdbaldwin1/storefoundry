import { expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export function buildMerchantIdentity() {
  const suffix = uniqueSuffix();
  return {
    suffix,
    email: `myrivo+${suffix}@example.com`,
    password: `Myrivo!${suffix.slice(-6)}`,
    storeName: `Tallow Studio ${suffix.slice(-4)}`,
    storeSlug: `tallow-${suffix.slice(-8).replace(/[^a-z0-9]/gi, "").toLowerCase()}`
  };
}

function readLocalEnv() {
  const envPath = path.resolve(__dirname, "../.env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const entries = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator === -1) return null;
      return [line.slice(0, separator), line.slice(separator + 1)] as const;
    })
    .filter((entry): entry is readonly [string, string] => entry !== null);

  return Object.fromEntries(entries);
}

async function ensureUserExists(email: string, password: string) {
  const env = readLocalEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing Supabase URL or service role key for E2E setup.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true
    })
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => ({}))) as { msg?: string };
  if (response.status === 422 && (payload.msg ?? "").toLowerCase().includes("already")) {
    return;
  }

  throw new Error(`Unable to provision E2E user: ${response.status} ${payload.msg ?? "unknown error"}`);
}

export async function signupAndOnboard(page: Page) {
  const identity = buildMerchantIdentity();
  await ensureUserExists(identity.email, identity.password);

  await login(page, identity.email, identity.password);

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("Store name").fill(identity.storeName);
  await page.getByLabel("Store slug").fill(identity.storeSlug);
  await page.getByRole("button", { name: /create store/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(identity.storeName)).toBeVisible();

  return identity;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
}

export async function activateStore(page: Page) {
  await page.goto("/dashboard/settings");
  await page.getByLabel("Store Status").selectOption("active");
  await page.getByRole("button", { name: /save profile/i }).click();
  await expect(page.getByText(/store settings saved/i)).toBeVisible();
}
