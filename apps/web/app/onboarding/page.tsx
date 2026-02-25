import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { StoreBootstrapForm } from "@/components/onboarding/store-bootstrap-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existingStore, error: existingStoreError } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingStoreError) {
    throw new Error(existingStoreError.message);
  }

  if (existingStore) {
    redirect("/dashboard");
  }

  return (
    <PageShell maxWidthClassName="max-w-xl">
      <StoreBootstrapForm />
    </PageShell>
  );
}
