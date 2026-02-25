import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { PageShell } from "@/components/layout/page-shell";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const bundle = await getOwnedStoreBundle(user.id);

  if (!bundle) {
    redirect("/onboarding");
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <DashboardNav storeSlug={bundle.store.slug} storeStatus={bundle.store.status} />
        {children}
      </div>
    </PageShell>
  );
}
