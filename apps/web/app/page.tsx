import { headers } from "next/headers";
import { HeroSection } from "@/components/home/hero-section";
import { PageShell } from "@/components/layout/page-shell";
import { StorefrontPage } from "@/components/storefront/storefront-page";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveTenantLookup } from "@/lib/tenant/resolve";

export const dynamic = "force-dynamic";

async function resolveTenantStore() {
  const hostHeader = (await headers()).get("host");
  const lookup = resolveTenantLookup(hostHeader);

  if (lookup.type === "platform" || lookup.type === "missing") {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  if (lookup.type === "slug") {
    const { data: store } = await supabase
      .from("stores")
      .select("id,name,slug,status")
      .eq("slug", lookup.key)
      .eq("status", "active")
      .maybeSingle();
    return store;
  }

  const { data: domain } = await supabase
    .from("store_domains")
    .select("store_id")
    .eq("domain", lookup.key)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (!domain) {
    return null;
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id,name,slug,status")
    .eq("id", domain.store_id)
    .eq("status", "active")
    .maybeSingle();

  return store;
}

export default async function HomePage() {
  const store = await resolveTenantStore();

  if (store) {
    const supabase = await createSupabaseServerClient();
    const [{ data: branding }, { data: products }] = await Promise.all([
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

    return <StorefrontPage store={store} branding={branding} products={products ?? []} />;
  }

  return (
    <PageShell maxWidthClassName="max-w-4xl">
      <HeroSection />
    </PageShell>
  );
}
