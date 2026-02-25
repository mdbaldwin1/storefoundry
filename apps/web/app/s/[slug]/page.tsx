import { notFound } from "next/navigation";
import { StorefrontPage } from "@/components/storefront/storefront-page";
import { isMissingRelationInSchemaCache } from "@/lib/supabase/error-classifiers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StorefrontRouteParams = {
  params: Promise<{ slug: string }>;
};

export default async function StorefrontSlugPage({ params }: StorefrontRouteParams) {
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,name,slug,status,owner_user_id")
    .eq("slug", resolvedParams.slug)
    .maybeSingle();

  if (storeError) {
    throw new Error(storeError.message);
  }

  if (!store) {
    notFound();
  }

  const isOwnerPreview = Boolean(user && user.id === store.owner_user_id);

  if (store.status !== "active" && !isOwnerPreview) {
    notFound();
  }

  const [
    { data: branding, error: brandingError },
    { data: settings, error: settingsError },
    { data: contentBlocks, error: contentBlocksError },
    { data: products, error: productsError }
  ] = await Promise.all([
    supabase
      .from("store_branding")
      .select("logo_path,primary_color,accent_color")
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
      .from("products")
      .select("id,title,description,image_url,price_cents,inventory_qty")
      .eq("store_id", store.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
  ]);

  if (brandingError) {
    throw new Error(brandingError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  if (settingsError && !isMissingRelationInSchemaCache(settingsError)) {
    throw new Error(settingsError.message);
  }

  if (contentBlocksError && !isMissingRelationInSchemaCache(contentBlocksError)) {
    throw new Error(contentBlocksError.message);
  }

  return (
    <StorefrontPage
      store={store}
      branding={branding}
      settings={settingsError ? null : settings}
      contentBlocks={contentBlocksError ? [] : (contentBlocks ?? [])}
      products={products ?? []}
    />
  );
}
