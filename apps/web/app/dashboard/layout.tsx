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
    <PageShell maxWidthClassName="max-w-7xl">
      <div className="space-y-5">
        <header className="rounded-lg border border-border bg-card px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Myrivo</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold">{bundle.store.name}</h1>
            <p className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {bundle.store.status}
            </p>
          </div>
        </header>
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <DashboardNav storeSlug={bundle.store.slug} storeStatus={bundle.store.status} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}
