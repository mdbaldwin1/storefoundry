import { BrandingSettingsForm } from "@/components/dashboard/branding-settings-form";
import { ContentBlocksManager } from "@/components/dashboard/content-blocks-manager";
import { DomainManager } from "@/components/dashboard/domain-manager";
import { InventoryMovementsPanel } from "@/components/dashboard/inventory-movements-panel";
import { PromotionsManager } from "@/components/dashboard/promotions-manager";
import { StorePoliciesForm } from "@/components/dashboard/store-policies-form";
import { StoreSettingsForm } from "@/components/dashboard/store-settings-form";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const bundle = await getOwnedStoreBundle(user.id);

  if (!bundle) {
    return null;
  }

  const { data: promotions, error: promotionsError } = await supabase
    .from("promotions")
    .select("id,code,discount_type,discount_value,min_subtotal_cents,max_redemptions,times_redeemed,starts_at,ends_at,is_active,created_at")
    .eq("store_id", bundle.store.id)
    .order("created_at", { ascending: false });

  if (promotionsError) {
    throw new Error(promotionsError.message);
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
      <header>
        <h1 className="text-2xl font-semibold">Store Settings</h1>
        <p className="text-sm text-muted-foreground">Manage profile, branding, and connected domains.</p>
      </header>
      <StoreSettingsForm initialStore={bundle.store} />
      <BrandingSettingsForm initialBranding={bundle.branding} />
      <StorePoliciesForm initialSettings={bundle.settings} />
      <ContentBlocksManager initialBlocks={bundle.contentBlocks} />
      <PromotionsManager initialPromotions={promotions ?? []} />
      <DomainManager initialDomains={bundle.domains} />
      <InventoryMovementsPanel />
    </section>
  );
}
