import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  StoreRecord,
  SubscriptionRecord,
  StoreBrandingRecord,
  StoreDomainRecord,
  StoreSettingsRecord,
  StoreContentBlockRecord
} from "@/types/database";

export type OwnedStoreBundle = {
  store: Pick<StoreRecord, "id" | "name" | "slug" | "status">;
  subscription: Pick<SubscriptionRecord, "plan_key" | "status" | "platform_fee_bps"> | null;
  branding: Pick<StoreBrandingRecord, "logo_path" | "primary_color" | "accent_color" | "theme_json"> | null;
  settings: Pick<
    StoreSettingsRecord,
    "support_email" | "fulfillment_message" | "shipping_policy" | "return_policy" | "announcement"
  > | null;
  contentBlocks: Array<
    Pick<StoreContentBlockRecord, "id" | "sort_order" | "eyebrow" | "title" | "body" | "cta_label" | "cta_url" | "is_active">
  >;
  domains: Array<Pick<StoreDomainRecord, "id" | "domain" | "is_primary" | "verification_status">>;
};

type SupabaseQueryError = {
  code?: string;
  message?: string;
} | null;

export function isMissingRelationInSchemaCache(error: SupabaseQueryError) {
  if (!error) {
    return false;
  }

  if (error.code === "PGRST205") {
    return true;
  }

  const message = error.message?.toLowerCase() ?? "";
  return message.includes("could not find the table") || message.includes("schema cache");
}

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
    { data: contentBlocks, error: contentBlocksError },
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
      .from("store_content_blocks")
      .select("id,sort_order,eyebrow,title,body,cta_label,cta_url,is_active")
      .eq("store_id", store.id)
      .order("sort_order", { ascending: true }),
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

  if (settingsError && !isMissingRelationInSchemaCache(settingsError)) {
    throw new Error(settingsError.message);
  }

  if (contentBlocksError && !isMissingRelationInSchemaCache(contentBlocksError)) {
    throw new Error(contentBlocksError.message);
  }

  if (settingsError && isMissingRelationInSchemaCache(settingsError)) {
    console.warn("store_settings relation missing in schema cache; continuing with default store settings.");
  }

  if (contentBlocksError && isMissingRelationInSchemaCache(contentBlocksError)) {
    console.warn("store_content_blocks relation missing in schema cache; continuing with empty content blocks.");
  }

  return {
    store,
    subscription,
    branding,
    settings: settingsError ? null : settings,
    contentBlocks: contentBlocks ?? [],
    domains: domains ?? []
  };
}

export async function getOwnedStoreId(userId: string): Promise<string | null> {
  const bundle = await getOwnedStoreBundle(userId);
  return bundle?.store.id ?? null;
}
