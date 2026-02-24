import { createBrowserClient } from "@supabase/ssr";
import { getCoreEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const env = getCoreEnv();

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
