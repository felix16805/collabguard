import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Middleware — runs at the edge on every request.
 *
 * Responsibilities:
 * 1. Refresh Supabase auth session (keeps cookies fresh)
 * 2. Protect /dashboard, /submissions, /analysis, /reports, /settings routes
 * 3. Set security headers on every response
 * 4. Enforce HTTPS (redirect http → https in production)
 */

// Routes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/submissions",
  "/analysis",
  "/reports",
  "/settings",
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // ─── Supabase session refresh ─────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  // SECURITY: Use getUser() not getSession() — validates with Auth server
  const { data: { user } } = await supabase.auth.getUser()

  // ─── Auth guard ───────────────────────────────────────────────────────
  const pathname = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged-in users away from auth pages
  if (user && ["/login", "/signup"].includes(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  // ─── HTTPS enforcement (production) ──────────────────────────────────
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = request.nextUrl.clone()
    httpsUrl.protocol = "https:"
    return NextResponse.redirect(httpsUrl, 301)
  }

  // ─── Security headers ─────────────────────────────────────────────────
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://plausible.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  response.headers.set("Content-Security-Policy", cspDirectives)
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  response.headers.set("X-DNS-Prefetch-Control", "on")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
}
