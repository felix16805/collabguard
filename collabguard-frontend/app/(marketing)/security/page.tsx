import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Security — CollabGuard",
  description: "A plain-English explanation of CollabGuard's security posture: authentication, data access, upload restrictions, session management, and dependency hygiene.",
}

function SecurityItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 py-6 border-b border-[var(--border)] last:border-0">
      <h3 className="font-display font-semibold text-base text-[var(--text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <article className="page-content max-w-3xl mx-auto px-6 py-24">
      <header className="mb-16 flex flex-col gap-4">
        <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest">Security posture</p>
        <h1 className="font-display font-semibold text-[var(--text-primary)]">
          How CollabGuard handles your data
        </h1>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
          This is a plain-English description of the security measures in place. It is written for
          instructors and students who want to understand what happens to uploaded code — not for
          auditors.
        </p>
      </header>

      <section className="mb-16" aria-labelledby="auth-heading">
        <h2 id="auth-heading" className="font-display font-semibold text-xl text-[var(--text-primary)] mb-2">
          Authentication
        </h2>
        <div>
          <SecurityItem
            title="Supabase Auth with JWT sessions"
            body="Authentication is handled by Supabase Auth. Passwords are hashed with bcrypt internally — CollabGuard never receives or stores raw passwords. Session tokens are stored in httpOnly, SameSite=Strict cookies and are inaccessible to JavaScript running in the page."
          />
          <SecurityItem
            title="Server-side session validation"
            body="Every authenticated request goes through middleware that calls supabase.auth.getUser() — not getSession(). getUser() validates the token with the Supabase Auth server on every request; it does not trust the local cookie alone. Client-side auth state is for UI only, never for access control."
          />
          <SecurityItem
            title="Rate-limited login"
            body="Login and password reset endpoints are rate-limited to 5 attempts per 15 minutes per IP. Public form endpoints (contact) are protected by a honeypot field and request rate limiting via Upstash Redis."
          />
        </div>
      </section>

      <section className="mb-16" aria-labelledby="data-heading">
        <h2 id="data-heading" className="font-display font-semibold text-xl text-[var(--text-primary)] mb-2">
          Data access
        </h2>
        <div>
          <SecurityItem
            title="Row Level Security on every table"
            body="All Supabase tables have explicit RLS policies. No table has an open 'allow all' policy. Users can only read their own records and records in courses they belong to. Instructors can read all records in their courses. Admin access is not exposed through the client."
          />
          <SecurityItem
            title="Field-level write restrictions"
            body="Update operations are validated server-side against a whitelist of mutable fields. A student cannot update their own role, course assignment, or any field outside their profile. All mutable fields are validated with zod schemas on the server before writes."
          />
          <SecurityItem
            title="No over-fetching"
            body="API responses return only the fields the client needs. Student records returned to instructors include only the fields necessary for the analysis view — no contact info, no unrelated metadata."
          />
        </div>
      </section>

      <section className="mb-16" aria-labelledby="uploads-heading">
        <h2 id="uploads-heading" className="font-display font-semibold text-xl text-[var(--text-primary)] mb-2">
          File uploads
        </h2>
        <div>
          <SecurityItem
            title="Private storage bucket with signed URLs"
            body="Submitted code files are stored in a private Supabase Storage bucket. Files are never publicly accessible. Instructors and students access their files through short-lived signed URLs (15-minute expiry) generated server-side."
          />
          <SecurityItem
            title="File type and size restrictions"
            body="Only source code files with allowed extensions (.py, .java, .c, .cpp, .js, .ts, .go, .rs) up to 10 MB are accepted. File type is validated server-side by inspecting the file content, not just the extension."
          />
        </div>
      </section>

      <section className="mb-16" aria-labelledby="transport-heading">
        <h2 id="transport-heading" className="font-display font-semibold text-xl text-[var(--text-primary)] mb-2">
          Transport and headers
        </h2>
        <div>
          <SecurityItem
            title="HTTPS enforced"
            body="All HTTP traffic is redirected to HTTPS at the edge. HSTS (Strict-Transport-Security) is set with a 1-year max-age and includeSubDomains in production."
          />
          <SecurityItem
            title="Security headers on every response"
            body="Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and Permissions-Policy (camera, microphone, geolocation: none) are set at the middleware layer on every response."
          />
        </div>
      </section>

      <section aria-labelledby="deps-heading">
        <h2 id="deps-heading" className="font-display font-semibold text-xl text-[var(--text-primary)] mb-2">
          Dependencies and secrets
        </h2>
        <div>
          <SecurityItem
            title="No secrets in client bundles"
            body="Only NEXT_PUBLIC_ environment variables are included in client bundles. The Supabase anon/public key is safe for client exposure by design. Service role keys and any backend secrets are server-side only and are never committed to git."
          />
          <SecurityItem
            title="Dependency vulnerability scanning"
            body="npm audit --audit-level=high runs as part of the build. No high or critical vulnerabilities are permitted to reach production."
          />
        </div>
      </section>
    </article>
  )
}
