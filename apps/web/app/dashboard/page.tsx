import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageShell } from "@/components/layout/page-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id,name,slug,status")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (storeError) {
    throw new Error(storeError.message);
  }

  if (!store) {
    redirect("/onboarding");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,title,description,price_cents,inventory_qty,status,created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    throw new Error(productsError.message);
  }

  return (
    <PageShell>
      <DashboardOverview store={store} products={products ?? []} />
    </PageShell>
  );
}
