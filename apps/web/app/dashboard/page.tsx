import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const bundle = await getOwnedStoreBundle(user.id);
  const store = bundle?.store;

  if (!store) {
    return null;
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,title,description,price_cents,inventory_qty,status,created_at")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  if (productsError) {
    throw new Error(productsError.message);
  }

  return <DashboardOverview store={store} products={products ?? []} subscription={bundle?.subscription ?? null} />;
}
