import { BrandingSettingsForm } from "@/components/dashboard/branding-settings-form";
import { DomainManager } from "@/components/dashboard/domain-manager";
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

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
      <header>
        <h1 className="text-2xl font-semibold">Store Settings</h1>
        <p className="text-sm text-muted-foreground">Manage profile, branding, and connected domains.</p>
      </header>
      <StoreSettingsForm initialStore={bundle.store} />
      <BrandingSettingsForm initialBranding={bundle.branding} />
      <DomainManager initialDomains={bundle.domains} />
    </section>
  );
}
