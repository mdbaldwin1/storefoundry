import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { getOwnedStoreBundle } from "@/lib/stores/owner-store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardInsightsPage() {
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

  const [{ data: orders, error: ordersError }, { data: products, error: productsError }] = await Promise.all([
    supabase
      .from("orders")
      .select("id,total_cents,status,platform_fee_cents,discount_cents,created_at")
      .eq("store_id", bundle.store.id)
      .order("created_at", { ascending: false })
      .limit(250),
    supabase
      .from("products")
      .select("id,title,inventory_qty,status")
      .eq("store_id", bundle.store.id)
      .order("created_at", { ascending: false })
  ]);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  if (productsError) {
    throw new Error(productsError.message);
  }

  return <InsightsPanel recentOrders={orders ?? []} products={products ?? []} />;
}
