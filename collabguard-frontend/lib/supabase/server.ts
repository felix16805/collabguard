import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Supabase server client — for use in Server Components, Server Actions,
 * and Route Handlers only. Uses httpOnly cookies via next/headers.
 *
 * SECURITY: Always use supabase.auth.getUser() (not getSession())
 * for server-side auth checks — getUser() validates with the Supabase
 * Auth server rather than trusting the local cookie.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Middleware handles refresh.
          }
        },
      },
    },
  )
}
