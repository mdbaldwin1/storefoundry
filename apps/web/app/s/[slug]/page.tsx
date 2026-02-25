import { notFound } from "next/navigation";
import { StorefrontPage } from "@/components/storefront/storefront-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type StorefrontRouteParams = {
  params: Promise<{ slug: string }>;
};

export default async function StorefrontSlugPage({ params }: StorefrontRouteParams) {
  const resolvedParams = await params;
  const supabase = await createSupabaseServerClient();

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,name,slug,status")
    .eq("slug", resolvedParams.slug)
    .eq("status", "active")
    .maybeSingle();

  if (storeError) {
    throw new Error(storeError.message);
  }

  if (!store) {
    notFound();
  }

  const [{ data: branding, error: brandingError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from("store_branding")
      .select("logo_path,primary_color,accent_color")
      .eq("store_id", store.id)
      .maybeSingle(),
    supabase
      .from("products")
      .select("id,title,description,price_cents,inventory_qty")
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

  return <StorefrontPage store={store} branding={branding} products={products ?? []} />;
}
