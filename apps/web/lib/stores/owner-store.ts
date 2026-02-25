import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  StoreRecord,
  SubscriptionRecord,
  StoreBrandingRecord,
  StoreDomainRecord,
  StoreSettingsRecord
} from "@/types/database";

export type OwnedStoreBundle = {
  store: Pick<StoreRecord, "id" | "name" | "slug" | "status">;
  subscription: Pick<SubscriptionRecord, "plan_key" | "status" | "platform_fee_bps"> | null;
  branding: Pick<StoreBrandingRecord, "logo_path" | "primary_color" | "accent_color" | "theme_json"> | null;
  settings: Pick<
    StoreSettingsRecord,
    "support_email" | "fulfillment_message" | "shipping_policy" | "return_policy" | "announcement"
  > | null;
  domains: Array<Pick<StoreDomainRecord, "id" | "domain" | "is_primary" | "verification_status">>;
};

export async function getOwnedStoreBundle(userId: string): Promise<OwnedStoreBundle | null> {
  const supabase = await createSupabaseServerClient();

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,name,slug,status")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (storeError) {
    throw new Error(storeError.message);
  }

  if (!store) {
    return null;
  }

  const [
    { data: subscription, error: subscriptionError },
    { data: branding, error: brandingError },
    { data: settings, error: settingsError },
    { data: domains, error: domainsError }
  ] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_key,status,platform_fee_bps")
        .eq("store_id", store.id)
        .maybeSingle(),
      supabase
        .from("store_branding")
        .select("logo_path,primary_color,accent_color,theme_json")
        .eq("store_id", store.id)
        .maybeSingle(),
      supabase
        .from("store_settings")
        .select("support_email,fulfillment_message,shipping_policy,return_policy,announcement")
        .eq("store_id", store.id)
        .maybeSingle(),
      supabase
        .from("store_domains")
        .select("id,domain,is_primary,verification_status")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
    ]);

  if (subscriptionError) {
    throw new Error(subscriptionError.message);
  }

  if (brandingError) {
    throw new Error(brandingError.message);
  }

  if (domainsError) {
    throw new Error(domainsError.message);
  }

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  return {
    store,
    subscription,
    branding,
    settings,
    domains: domains ?? []
  };
}

export async function getOwnedStoreId(userId: string): Promise<string | null> {
  const bundle = await getOwnedStoreBundle(userId);
  return bundle?.store.id ?? null;
}
