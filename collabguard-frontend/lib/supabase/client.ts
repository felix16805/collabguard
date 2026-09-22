import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase browser client — for use in Client Components only.
 * Exposes only the public anon key (safe for client bundles).
 * Never expose service role key or any secret here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
